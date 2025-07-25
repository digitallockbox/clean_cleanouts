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

// GET - Retrieve payment methods for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile to get Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ 
        success: true, 
        paymentMethods: [] 
      });
    }

    // Retrieve payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    });

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);

    const formattedPaymentMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      } : null,
      isDefault: (customer as Stripe.Customer).invoice_settings?.default_payment_method === pm.id,
      created: pm.created,
    }));

    return NextResponse.json({
      success: true,
      paymentMethods: formattedPaymentMethods,
    });

  } catch (error) {
    logger.error('Error retrieving payment methods:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ 
        error: 'Error retrieving payment methods',
        details: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a payment method
export async function DELETE(request: NextRequest) {
  try {
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully',
    });

  } catch (error) {
    logger.error('Error removing payment method:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ 
        error: 'Error removing payment method',
        details: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Set default payment method
export async function PUT(request: NextRequest) {
  try {
    const { userId, paymentMethodId } = await request.json();

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ 
        error: 'User ID and payment method ID are required' 
      }, { status: 400 });
    }

    // Get user profile to get Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update customer's default payment method
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully',
    });

  } catch (error) {
    logger.error('Error setting default payment method:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ 
        error: 'Error setting default payment method',
        details: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}