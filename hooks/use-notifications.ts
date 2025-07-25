'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface UseNotificationsOptions {
  autoFetch?: boolean;
  unreadOnly?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { autoFetch = true, unreadOnly = false } = options;
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (unreadOnly) {
        params.append('unread_only', 'true');
      }

      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setNotifications(data.notifications || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      logger.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ read: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      return data.notification;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      toast.error(errorMessage);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      await Promise.all(
        unreadNotifications.map(notification => markAsRead(notification.id))
      );

      toast.success('All notifications marked as read');
    } catch (err) {
      logger.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete notification');
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      toast.success('Notification deleted');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      toast.error(errorMessage);
      throw err;
    }
  };

  const createNotification = async (notificationData: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    user_id?: string;
  }) => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(notificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create notification');
      }

      // If it's for the current user, add to local state
      if (!notificationData.user_id || notificationData.user_id === user?.id) {
        setNotifications(prev => [data.notification, ...prev]);
      }

      return data.notification;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create notification';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (autoFetch && user) {
      fetchNotifications();
    }
  }, [user, autoFetch, unreadOnly]);

  // Don't fetch notifications if user is not authenticated
  if (!user) {
    return {
      notifications: [],
      loading: false,
      error: null,
      unreadCount: 0,
      fetchNotifications: () => Promise.resolve(),
      markAsRead: () => Promise.resolve(null),
      markAllAsRead: () => Promise.resolve(),
      deleteNotification: () => Promise.resolve(false),
      createNotification: () => Promise.resolve(null),
      refetch: () => Promise.resolve(),
    };
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refetch: fetchNotifications,
  };
};

// Hook specifically for unread notifications count
export const useUnreadNotifications = () => {
  return useNotifications({ unreadOnly: true });
};