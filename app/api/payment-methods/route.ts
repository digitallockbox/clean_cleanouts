import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Payment method validation schema
const paymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_account']),
  card_last_four: z.string().optional(),
  card_brand: z.string().optional(),
  card_exp_month: z.number().min(1).max(12).optional(),
  card_exp_year: z.number().min(new Date().getFullYear()).optional(),
  bank_name: z.string().optional(),
  account_last_four: z.string().optional(),
  is_default: z.boolean().default(false),
  stripe_payment_method_id: z.string().optional(),
});

// GET /api/payment-methods - List user's saved payment methods
export async function GET(request: NextRequest) {
  try {
    // Check authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: paymentMethods, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching payment methods:', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    // Remove sensitive data before sending to client
    const sanitizedMethods = paymentMethods?.map(method => ({
      ...method,
      stripe_payment_method_id: undefined, // Don't send to client
    })) || [];

    return NextResponse.json({
      success: true,
      data: sanitizedMethods,
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/payment-methods - Add new payment method
export async function POST(request: NextRequest) {
  try {
    // Check authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = paymentMethodSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const paymentMethodData = validationResult.data;

    // If this is set as default, unset other default methods
    if (paymentMethodData.is_default) {
      await supabaseAdmin
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Create payment method
    const { data: paymentMethod, error: createError } = await supabaseAdmin
      .from('payment_methods')
      .insert({
        user_id: user.id,
        ...paymentMethodData,
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating payment method:', createError);
      return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
    }

    // Remove sensitive data before sending to client
    const sanitizedMethod = {
      ...paymentMethod,
      stripe_payment_method_id: undefined,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedMethod,
      message: 'Payment method added successfully',
    }, { status: 201 });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
