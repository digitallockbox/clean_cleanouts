import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let bookingId: string | undefined;

  try {
    const body = await request.json();
    bookingId = body.bookingId;

    // Enhanced validation
    if (!bookingId) {
      logger.error('[PAYMENT_INTENT] Missing booking ID in request');
      return NextResponse.json({ 
        error: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID' 
      }, { status: 400 });
    }

    // Validate booking ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(bookingId)) {
      logger.error('[PAYMENT_INTENT] Invalid booking ID format:', bookingId);
      return NextResponse.json({ 
        error: 'Invalid booking ID format',
        code: 'INVALID_BOOKING_ID' 
      }, { status: 400 });
    }

    logger.info(`[PAYMENT_INTENT] Processing payment intent for booking: ${bookingId}`);

    // Get booking details with enhanced error handling
    const { data: booking, error: bookingError } = await supabase
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

    if (bookingError) {
      logger.error('[PAYMENT_INTENT] Database error fetching booking:', bookingError);
      return NextResponse.json({ 
        error: 'Failed to fetch booking details',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? bookingError.message : undefined
      }, { status: 500 });
    }

    if (!booking) {
      logger.error('[PAYMENT_INTENT] Booking not found:', bookingId);
      return NextResponse.json({ 
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND' 
      }, { status: 404 });
    }

    // Validate booking data
    if (!booking.total_price || booking.total_price <= 0) {
      logger.error('[PAYMENT_INTENT] Invalid booking total price:', booking.total_price);
      return NextResponse.json({ 
        error: 'Invalid booking amount',
        code: 'INVALID_AMOUNT' 
      }, { status: 400 });
    }

    if (!booking.services) {
      logger.error('[PAYMENT_INTENT] Missing service data for booking:', bookingId);
      return NextResponse.json({ 
        error: 'Booking service data incomplete',
        code: 'INCOMPLETE_BOOKING_DATA' 
      }, { status: 400 });
    }

    if (!booking.profiles?.email) {
      logger.error('[PAYMENT_INTENT] Missing customer email for booking:', bookingId);
      return NextResponse.json({ 
        error: 'Customer email not found',
        code: 'MISSING_CUSTOMER_EMAIL' 
      }, { status: 400 });
    }

    // Check if booking is already paid
    if (booking.payment_status === 'paid') {
      logger.info('[PAYMENT_INTENT] Booking already paid:', bookingId);
      return NextResponse.json({ 
        error: 'Booking is already paid',
        code: 'ALREADY_PAID' 
      }, { status: 400 });
    }

    // Check if booking already has a payment intent
    if (booking.payment_intent_id) {
      logger.info('[PAYMENT_INTENT] Retrieving existing payment intent:', booking.payment_intent_id);
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
        
        if (paymentIntent.status === 'succeeded') {
          logger.info('[PAYMENT_INTENT] Existing payment intent already succeeded:', booking.payment_intent_id);
          return NextResponse.json({ 
            error: 'Booking is already paid',
            code: 'ALREADY_PAID' 
          }, { status: 400 });
        }

        if (paymentIntent.status === 'canceled') {
          logger.info('[PAYMENT_INTENT] Existing payment intent was canceled, creating new one');
          // Continue to create new payment intent
        } else {
          logger.info('[PAYMENT_INTENT] Returning existing payment intent:', booking.payment_intent_id);
          return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
          });
        }
      } catch (stripeError) {
        logger.error('[PAYMENT_INTENT] Error retrieving existing payment intent:', stripeError);
        if (stripeError instanceof Stripe.errors.StripeError) {
          logger.info('[PAYMENT_INTENT] Stripe error retrieving payment intent, creating new one:', stripeError.message);
          // Continue to create new payment intent
        } else {
          throw stripeError;
        }
      }
    }

    // Calculate amount in cents
    const amountInCents = Math.round(booking.total_price * 100);
    
    if (amountInCents < 50) { // Stripe minimum is $0.50
      logger.error('[PAYMENT_INTENT] Amount too small for Stripe:', amountInCents);
      return NextResponse.json({ 
        error: 'Payment amount too small (minimum $0.50)',
        code: 'AMOUNT_TOO_SMALL' 
      }, { status: 400 });
    }

    logger.info(`[PAYMENT_INTENT] Creating new payment intent for ${booking.total_price}`);

    // Create new payment intent with enhanced metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        userId: booking.user_id,
        serviceId: booking.service_id,
        serviceName: booking.services.name,
        bookingDate: booking.booking_date,
        environment: process.env.NODE_ENV || 'development',
      },
      description: `Payment for ${booking.services.name} - ${booking.booking_date}`,
      receipt_email: booking.profiles.email,
      statement_descriptor: 'CLEANOUTS PRO',
    });

    logger.info('[PAYMENT_INTENT] Payment intent created successfully:', paymentIntent.id);

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('[PAYMENT_INTENT] Error updating booking with payment intent:', updateError);
      // Don't fail the request, as payment intent is created successfully
      // The webhook will handle the status update when payment succeeds
    } else {
      logger.info('[PAYMENT_INTENT] Booking updated with payment intent ID');
    }

    const processingTime = Date.now() - startTime;
    logger.info(`[PAYMENT_INTENT] Payment intent creation completed in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      processingTimeMs: processingTime,
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('[PAYMENT_INTENT] Payment intent creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      const errorCode = error.code || 'STRIPE_ERROR';
      const errorMessage = error.message || 'Payment processing error';
      
      logger.error(`[PAYMENT_INTENT] Stripe error (${errorCode}):`, errorMessage);
      
      return NextResponse.json({ 
        error: 'Payment processing error',
        code: errorCode,
        details: errorMessage,
        processingTimeMs: processingTime,
      }, { status: 400 });
    }

    // Log unexpected errors with more context
    logger.error('[PAYMENT_INTENT] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bookingId,
      processingTimeMs: processingTime,
    });

    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      processingTimeMs: processingTime,
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : undefined,
    }, { status: 500 });
  }
}