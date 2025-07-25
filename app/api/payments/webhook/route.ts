import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enhanced logging function
const logWebhookEvent = async (eventType: string, eventId: string, status: 'success' | 'error', details?: any) => {
  const logEntry = {
    event_type: eventType,
    event_id: eventId,
    status,
    details: details ? JSON.stringify(details) : null,
    timestamp: new Date().toISOString(),
  };

  try {
    await supabase.from('webhook_logs').insert(logEntry);
  } catch (error) {
    logger.error('Failed to log webhook event:', error);
  }

  // Also log to console for development
  logger.info(`[WEBHOOK ${status.toUpperCase()}] ${eventType} (${eventId}):`, details || 'No additional details');
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let eventId = 'unknown';
  let eventType = 'unknown';

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      await logWebhookEvent('webhook_error', 'no-signature', 'error', {
        error: 'Missing stripe signature',
        headers: Object.fromEntries(request.headers.entries()),
      });
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      eventId = event.id;
      eventType = event.type;
    } catch (error) {
      const errorDetails = {
        error: error instanceof Error ? error.message : 'Unknown error',
        signature: signature.substring(0, 20) + '...',
        bodyLength: body.length,
      };
      
      await logWebhookEvent('webhook_verification_failed', 'signature-error', 'error', errorDetails);
      logger.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log webhook received
    await logWebhookEvent(eventType, eventId, 'success', {
      message: 'Webhook received and verified',
      processingStarted: true,
    });

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, eventId);
          break;
        
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, eventId);
          break;
        
        case 'payment_intent.canceled':
          await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent, eventId);
          break;

        case 'setup_intent.succeeded':
          await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent, eventId);
          break;

        case 'setup_intent.setup_failed':
          await handleSetupIntentFailed(event.data.object as Stripe.SetupIntent, eventId);
          break;
        
        default:
          await logWebhookEvent(eventType, eventId, 'success', {
            message: `Unhandled event type: ${event.type}`,
            ignored: true,
          });
          logger.info(`Unhandled event type: ${event.type}`);
      }

      const processingTime = Date.now() - startTime;
      await logWebhookEvent(eventType, eventId, 'success', {
        message: 'Webhook processed successfully',
        processingTimeMs: processingTime,
      });

      return NextResponse.json({ 
        received: true, 
        eventId,
        processingTimeMs: processingTime,
      });

    } catch (handlerError) {
      const errorDetails = {
        error: handlerError instanceof Error ? handlerError.message : 'Unknown handler error',
        stack: handlerError instanceof Error ? handlerError.stack : undefined,
        eventType,
        eventId,
      };

      await logWebhookEvent(eventType, eventId, 'error', errorDetails);
      logger.error('Webhook handler error:', handlerError);
      
      return NextResponse.json({ 
        error: 'Webhook handler failed',
        eventId,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      }, { status: 500 });
    }

  } catch (error) {
    const errorDetails = {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      eventType,
      eventId,
    };

    await logWebhookEvent('webhook_error', eventId, 'error', errorDetails);
    logger.error('Webhook processing error:', error);
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      eventId,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
    }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    const error = 'No booking ID in payment intent metadata';
    await logWebhookEvent('payment_intent.succeeded', eventId, 'error', { error, paymentIntentId: paymentIntent.id });
    throw new Error(error);
  }

  try {
    // Record payment in payments table
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'paid',
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      await logWebhookEvent('payment_intent.succeeded', eventId, 'error', { 
        error: 'Failed to record payment', 
        details: paymentError,
        bookingId,
        paymentIntentId: paymentIntent.id 
      });
      throw paymentError;
    }

    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: PAYMENT_STATUSES.PAID,
        status: BOOKING_STATUSES.CONFIRMED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      await logWebhookEvent('payment_intent.succeeded', eventId, 'error', { 
        error: 'Failed to update booking status', 
        details: bookingError,
        bookingId,
        paymentIntentId: paymentIntent.id 
      });
      throw bookingError;
    }

    // Get booking details for notification
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          description
        ),
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      await logWebhookEvent('payment_intent.succeeded', eventId, 'error', { 
        error: 'Failed to fetch booking details', 
        details: fetchError,
        bookingId 
      });
      throw fetchError || new Error('Booking not found');
    }

    // Create notification for successful payment
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: 'Payment Confirmed',
      message: `Your payment for ${booking.services.name} on ${booking.booking_date} has been confirmed. Your booking is now confirmed!`,
      type: 'success',
      read: false,
    });

    await logWebhookEvent('payment_intent.succeeded', eventId, 'success', {
      message: 'Payment processed successfully',
      bookingId,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      customerEmail: booking.profiles.email,
    });

  } catch (error) {
    await logWebhookEvent('payment_intent.succeeded', eventId, 'error', { 
      error: 'Error in payment success handler', 
      details: error instanceof Error ? error.message : 'Unknown error',
      bookingId,
      paymentIntentId: paymentIntent.id 
    });
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    const error = 'No booking ID in payment intent metadata';
    await logWebhookEvent('payment_intent.payment_failed', eventId, 'error', { error, paymentIntentId: paymentIntent.id });
    throw new Error(error);
  }

  try {
    // Record failed payment
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'failed',
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      await logWebhookEvent('payment_intent.payment_failed', eventId, 'error', { 
        error: 'Failed to record failed payment', 
        details: paymentError,
        bookingId 
      });
    }

    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: PAYMENT_STATUSES.FAILED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      await logWebhookEvent('payment_intent.payment_failed', eventId, 'error', { 
        error: 'Failed to update booking status', 
        details: bookingError,
        bookingId 
      });
      throw bookingError;
    }

    // Get booking details for notification
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        services (name)
      `)
      .eq('id', bookingId)
      .single();

    if (booking) {
      // Create notification for failed payment
      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        title: 'Payment Failed',
        message: `Your payment for ${booking.services.name} on ${booking.booking_date} failed. Please try again or contact support.`,
        type: 'error',
        read: false,
      });
    }

    await logWebhookEvent('payment_intent.payment_failed', eventId, 'success', {
      message: 'Payment failure handled successfully',
      bookingId,
      paymentIntentId: paymentIntent.id,
      lastPaymentError: paymentIntent.last_payment_error?.message,
    });

  } catch (error) {
    await logWebhookEvent('payment_intent.payment_failed', eventId, 'error', { 
      error: 'Error in payment failure handler', 
      details: error instanceof Error ? error.message : 'Unknown error',
      bookingId 
    });
    throw error;
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    const error = 'No booking ID in payment intent metadata';
    await logWebhookEvent('payment_intent.canceled', eventId, 'error', { error, paymentIntentId: paymentIntent.id });
    throw new Error(error);
  }

  try {
    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: PAYMENT_STATUSES.PENDING,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      await logWebhookEvent('payment_intent.canceled', eventId, 'error', { 
        error: 'Failed to update booking status', 
        details: bookingError,
        bookingId 
      });
      throw bookingError;
    }

    await logWebhookEvent('payment_intent.canceled', eventId, 'success', {
      message: 'Payment cancellation handled successfully',
      bookingId,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    await logWebhookEvent('payment_intent.canceled', eventId, 'error', { 
      error: 'Error in payment cancellation handler', 
      details: error instanceof Error ? error.message : 'Unknown error',
      bookingId 
    });
    throw error;
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent, eventId: string) {
  try {
    const customerId = setupIntent.customer as string;
    const paymentMethodId = setupIntent.payment_method as string;

    await logWebhookEvent('setup_intent.succeeded', eventId, 'success', {
      message: 'Payment method setup completed successfully',
      customerId,
      paymentMethodId,
      setupIntentId: setupIntent.id,
    });

    // Note: The payment method is automatically attached to the customer by Stripe
    // No additional action needed here, but we could send a notification to the user

  } catch (error) {
    await logWebhookEvent('setup_intent.succeeded', eventId, 'error', { 
      error: 'Error in setup intent success handler', 
      details: error instanceof Error ? error.message : 'Unknown error',
      setupIntentId: setupIntent.id 
    });
    throw error;
  }
}

async function handleSetupIntentFailed(setupIntent: Stripe.SetupIntent, eventId: string) {
  try {
    await logWebhookEvent('setup_intent.setup_failed', eventId, 'success', {
      message: 'Payment method setup failed',
      setupIntentId: setupIntent.id,
      lastSetupError: setupIntent.last_setup_error?.message,
    });

    // Could send notification to user about failed setup if needed

  } catch (error) {
    await logWebhookEvent('setup_intent.setup_failed', eventId, 'error', { 
      error: 'Error in setup intent failure handler', 
      details: error instanceof Error ? error.message : 'Unknown error',
      setupIntentId: setupIntent.id 
    });
    throw error;
  }
}