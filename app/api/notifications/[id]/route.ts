import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
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

    const body = await request.json();
    const { read } = body;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ read, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user can only update their own notifications
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error in notification update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id); // Ensure user can only delete their own notifications

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error in notification delete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}