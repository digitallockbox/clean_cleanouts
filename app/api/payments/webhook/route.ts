import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '@/lib/constants';

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
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata');
    return;
  }

  try {
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
      console.error('Error updating booking after successful payment:', bookingError);
      return;
    }

    // Get booking details for email
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
      console.error('Error fetching booking for confirmation email:', fetchError);
      return;
    }

    // Create notification for successful payment
    await supabase.from('notifications').insert({
      user_id: booking.user_id,
      title: 'Payment Confirmed',
      message: `Your payment for ${booking.services.name} on ${booking.booking_date} has been confirmed. Your booking is now confirmed!`,
      type: 'success',
      read: false,
    });

    console.log('Payment succeeded for booking:', bookingId);
    console.log('Send confirmation email to:', booking.profiles.email);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata');
    return;
  }

  try {
    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        payment_status: PAYMENT_STATUSES.FAILED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error updating booking after failed payment:', bookingError);
      return;
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

    console.log('Payment failed for booking:', bookingId);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;
  
  if (!bookingId) {
    console.error('No booking ID in payment intent metadata');
    return;
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
      console.error('Error updating booking after canceled payment:', bookingError);
      return;
    }

    console.log('Payment canceled for booking:', bookingId);

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}