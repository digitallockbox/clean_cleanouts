import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT /api/payment-methods/[id] - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Check if payment method exists and belongs to user
    const { data: existingMethod, error: fetchError } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // If setting as default, unset other default methods
    if (body.is_default && !existingMethod.is_default) {
      await supabaseAdmin
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .neq('id', id);
    }

    // Update payment method
    const { data: updatedMethod, error: updateError } = await supabaseAdmin
      .from('payment_methods')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
        is_active: true,  // Ensure active status is maintained on update
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment method:', updateError);
      return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
    }

    // Remove sensitive data before sending to client
    const sanitizedMethod = {
      ...updatedMethod,
      stripe_payment_method_id: undefined,
    };

    return NextResponse.json({
      success: true,
      data: sanitizedMethod,
      message: 'Payment method updated successfully',
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/payment-methods/[id] - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if payment method exists and belongs to user
    const { data: existingMethod, error: fetchError } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Soft delete the payment method
    const { error: deleteError } = await supabaseAdmin
      .from('payment_methods')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting payment method:', deleteError);
      return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
    }

    // If this was the default method, set another one as default
    if (existingMethod.is_default) {
      const { data: otherMethods } = await supabaseAdmin
        .from('payment_methods')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)  // Only consider active payment methods
        .neq('id', id)
        .limit(1);

      if (otherMethods && otherMethods.length > 0) {
        await supabaseAdmin
          .from('payment_methods')
          .update({ is_default: true })
          .eq('id', otherMethods[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully',
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
