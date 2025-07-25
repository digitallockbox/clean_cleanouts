'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface AdminProfile {
  id: string;
  role: 'user' | 'admin' | 'super_admin';
  is_active: boolean;
  permissions: Record<string, any>;
  last_login?: string;
}

interface AdminAuthState {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminProfile: AdminProfile | null;
  permissions: Record<string, any>;
  loading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const [adminState, setAdminState] = useState<AdminAuthState>({
    isAdmin: false,
    isSuperAdmin: false,
    adminProfile: null,
    permissions: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAdminState({
        isAdmin: false,
        isSuperAdmin: false,
        adminProfile: null,
        permissions: {},
        loading: false,
        error: null,
      });
      return;
    }

    checkAdminStatus();
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    try {
      setAdminState(prev => ({ ...prev, loading: true, error: null }));

      // Get user profile with role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, is_active, permissions, last_login')
        .eq('id', user!.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error('Profile not found');
      }

      const isAdmin = ['admin', 'super_admin'].includes(profile.role) && profile.is_active;
      const isSuperAdmin = profile.role === 'super_admin' && profile.is_active;

      // Get additional permissions from roles if user is admin
      let allPermissions = profile.permissions || {};

      if (isAdmin) {
        const { data: userRoles } = await supabase
          .from('admin_user_roles')
          .select(`
            admin_roles (
              name,
              permissions
            )
          `)
          .eq('user_id', user!.id)
          .eq('is_active', true);

        // Merge role permissions
        if (userRoles) {
          userRoles.forEach((userRole: any) => {
            if (userRole.admin_roles?.permissions) {
              allPermissions = { ...allPermissions, ...userRole.admin_roles.permissions };
            }
          });
        }
      }

      setAdminState({
        isAdmin,
        isSuperAdmin,
        adminProfile: profile as AdminProfile,
        permissions: allPermissions,
        loading: false,
        error: null,
      });

      // Update last login if admin
      if (isAdmin) {
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user!.id);
      }

    } catch (error) {
      logger.error('Error checking admin status:', error);
      setAdminState({
        isAdmin: false,
        isSuperAdmin: false,
        adminProfile: null,
        permissions: {},
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check admin status',
      });
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (adminState.isSuperAdmin) return true;
    
    const resourcePermissions = adminState.permissions[resource];
    if (!resourcePermissions) return false;
    
    return resourcePermissions[action] === true;
  };

  const logAdminAction = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    if (!adminState.isAdmin) return;

    try {
      await supabase.from('admin_audit_logs').insert({
        user_id: user!.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
      });
    } catch (error) {
      logger.error('Error logging admin action:', error);
    }
  };

  const requireAdmin = () => {
    if (!adminState.isAdmin) {
      throw new Error('Admin access required');
    }
  };

  const requireSuperAdmin = () => {
    if (!adminState.isSuperAdmin) {
      throw new Error('Super admin access required');
    }
  };

  const requirePermission = (resource: string, action: string) => {
    if (!hasPermission(resource, action)) {
      throw new Error(`Permission denied: ${resource}.${action}`);
    }
  };

  return {
    ...adminState,
    hasPermission,
    logAdminAction,
    requireAdmin,
    requireSuperAdmin,
    requirePermission,
    refreshAdminStatus: checkAdminStatus,
  };
}