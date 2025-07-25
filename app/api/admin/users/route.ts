import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to check admin permissions
async function checkAdminPermissions(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: 'Missing authorization header', status: 401 };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: 'Invalid token', status: 401 };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role) || !profile.is_active) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return { user, profile };
}

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminPermissions(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        is_active,
        last_login,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, error, count } = await query;

    if (error) {
      logger.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get user emails from auth.users (requires service role)
    const userIds = users?.map(u => u.id) || [];
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    const usersWithEmails = users?.map(user => {
      const authUser = authUsers.users.find(au => au.id === user.id);
      return {
        ...user,
        email: authUser?.email || 'N/A'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithEmails,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Admin users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user role/status (super admin only)
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkAdminPermissions(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { profile: adminProfile } = authCheck;

    // Only super admins can modify user roles
    if (adminProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { userId, role, isActive } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.is_active = isActive;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_audit_logs').insert({
      user_id: authCheck.user.id,
      action: 'update_user',
      resource_type: 'user',
      resource_id: userId,
      new_values: updateData
    });

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    logger.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deactivate user (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await checkAdminPermissions(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { profile: adminProfile } = authCheck;

    // Only super admins can deactivate users
    if (adminProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow deactivating yourself
    if (userId === authCheck.user.id) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error deactivating user:', error);
      return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }

    // Log admin action
    await supabase.from('admin_audit_logs').insert({
      user_id: authCheck.user.id,
      action: 'deactivate_user',
      resource_type: 'user',
      resource_id: userId
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    logger.error('Admin user deactivation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}