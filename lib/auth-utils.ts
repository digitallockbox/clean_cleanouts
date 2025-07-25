import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin' | 'moderator';
  is_active: boolean;
  full_name?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  status?: number;
}

/**
 * Extract and verify JWT token from request
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      logger.warn('Auth: Missing authorization header');
      return { 
        success: false, 
        error: 'Missing authorization header', 
        status: 401 
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Auth: Invalid authorization header format');
      return { 
        success: false, 
        error: 'Invalid authorization header format', 
        status: 401 
      };
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Auth: Invalid or expired token', { error: authError?.message });
      return { 
        success: false, 
        error: 'Invalid or expired token', 
        status: 401 
      };
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Auth: Error fetching user profile', profileError);
      return { 
        success: false, 
        error: 'Error fetching user profile', 
        status: 500 
      };
    }

    if (!profile) {
      logger.warn('Auth: User profile not found', { userId: user.id });
      return { 
        success: false, 
        error: 'User profile not found', 
        status: 404 
      };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email!,
      role: profile.role || 'user',
      is_active: profile.is_active ?? true,
      full_name: profile.full_name,
    };

    logger.auth('User authenticated', user.id, { 
      role: authUser.role, 
      is_active: authUser.is_active 
    });

    return { 
      success: true, 
      user: authUser 
    };

  } catch (error) {
    logger.error('Auth: Unexpected error during authentication', error);
    return { 
      success: false, 
      error: 'Authentication failed', 
      status: 500 
    };
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: AuthUser): boolean {
  return ['admin', 'super_admin'].includes(user.role) && user.is_active;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === 'super_admin' && user.is_active;
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  user: AuthUser, 
  resource: string, 
  action: string
): Promise<boolean> {
  // Super admin has all permissions
  if (isSuperAdmin(user)) {
    return true;
  }

  // Regular users have no admin permissions
  if (!isAdmin(user)) {
    return false;
  }

  try {
    // Get user permissions from database
    const { data: permissions } = await supabase
      .rpc('get_user_permissions', { user_uuid: user.id });

    if (!permissions || !permissions[resource]) {
      return false;
    }

    return permissions[resource][action] === true;
  } catch (error) {
    logger.error('Auth: Error checking permissions', error);
    return false;
  }
}

/**
 * Middleware for admin route protection
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await getAuthUser(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  if (!isAdmin(authResult.user)) {
    logger.warn('Auth: Admin access denied', { 
      userId: authResult.user.id, 
      role: authResult.user.role 
    });
    return { 
      success: false, 
      error: 'Admin access required', 
      status: 403 
    };
  }

  return authResult;
}

/**
 * Middleware for super admin route protection
 */
export async function requireSuperAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await getAuthUser(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  if (!isSuperAdmin(authResult.user)) {
    logger.warn('Auth: Super admin access denied', { 
      userId: authResult.user.id, 
      role: authResult.user.role 
    });
    return { 
      success: false, 
      error: 'Super admin access required', 
      status: 403 
    };
  }

  return authResult;
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  user: AuthUser,
  action: string,
  resourceType?: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      user_id: user.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
    });

    logger.admin(action, user.id, {
      resourceType,
      resourceId,
      hasOldValues: !!oldValues,
      hasNewValues: !!newValues,
    });
  } catch (error) {
    logger.error('Auth: Error logging admin action', error);
  }
}