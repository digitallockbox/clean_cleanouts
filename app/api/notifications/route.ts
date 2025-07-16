import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for server-side operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { title, message, type = 'info', user_id } = body;

    // Allow admins to send notifications to specific users
    const targetUserId = user_id || user.id;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title,
        message,
        type,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}