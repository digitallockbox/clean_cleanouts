import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get booking details
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

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking already has a payment intent
    if (booking.payment_intent_id) {
      // Retrieve existing payment intent
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
        
        if (paymentIntent.status === 'succeeded') {
          return NextResponse.json({ error: 'Booking is already paid' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (stripeError) {
        console.error('Error retrieving payment intent:', stripeError);
        // Continue to create new payment intent if retrieval fails
      }
    }

    // Create new payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: booking.id,
        userId: booking.user_id,
        serviceId: booking.service_id,
      },
      description: `Payment for ${booking.services.name} - ${booking.booking_date}`,
      receipt_email: booking.profiles.email,
    });

    // Update booking with payment intent ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with payment intent:', updateError);
      // Don't fail the request, as payment intent is created
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ 
        error: 'Payment processing error',
        details: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}