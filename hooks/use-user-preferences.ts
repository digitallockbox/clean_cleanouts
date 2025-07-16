'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

interface UserPreferences {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  booking_reminders: boolean;
  preferred_contact_method: 'email' | 'phone' | 'sms';
  timezone: string;
  created_at?: string;
  updated_at?: string;
}

interface UseUserPreferencesOptions {
  autoFetch?: boolean;
  cacheTime?: number; // Cache duration in milliseconds
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<boolean>;
  isStale: boolean;
}

// Global cache for user preferences data
const userPreferencesCache = new Map<string, {
  data: UserPreferences;
  timestamp: number;
}>();

export function useUserPreferences(options: UseUserPreferencesOptions = {}): UseUserPreferencesReturn {
  const { autoFetch = true, cacheTime = 15 * 60 * 1000 } = options; // 15 minutes default cache (preferences change less frequently)
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const lastFetchRef = useRef<number>(0);

  const getCacheKey = useCallback(() => {
    return `user_preferences_${user?.id}`;
  }, [user?.id]);

  const fetchUserPreferences = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('No user found, skipping preferences fetch');
      return;
    }

    const cacheKey = getCacheKey();
    const now = Date.now();
    const cached = userPreferencesCache.get(cacheKey);
    
    // Check if we have valid cached data and don't need to force refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < cacheTime) {
      console.log('Using cached user preferences data');
      setPreferences(cached.data);
      setIsStale(false);
      return;
    }

    // Check if we should skip fetching if we just fetched recently (prevent rapid refetches)
    if (!forceRefresh && (now - lastFetchRef.current) < 1000) {
      console.log('Skipping preferences fetch - too recent');
      return;
    }

    console.log('Fetching user preferences for user:', user.id);
    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      // First, verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('No valid session found:', sessionError);
        throw new Error('Authentication required');
      }

      console.log('Valid session found, proceeding with preferences query');

      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is okay for preferences
        console.error('Supabase user preferences query error:', fetchError);
        throw fetchError;
      }

      let preferencesData: UserPreferences;

      if (!data || fetchError?.code === 'PGRST116') {
        // No preferences found, create default preferences
        console.log('No preferences found, creating default preferences');
        preferencesData = {
          user_id: user.id,
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          booking_reminders: true,
          preferred_contact_method: 'email',
          timezone: 'America/New_York',
        };

        // Try to create default preferences in the database
        try {
          const { data: insertedData, error: insertError } = await supabase
            .from('user_preferences')
            .insert(preferencesData)
            .select()
            .single();

          if (insertError) {
            console.log('Could not create default preferences in database:', insertError);
            // Continue with default preferences data
          } else {
            preferencesData = insertedData;
          }
        } catch (insertErr) {
          console.log('Preferences table may not exist yet:', insertErr);
          // Continue with default preferences data
        }
      } else {
        preferencesData = data;
      }

      console.log('User preferences query successful');

      // Cache the results
      userPreferencesCache.set(cacheKey, {
        data: preferencesData,
        timestamp: now,
      });

      setPreferences(preferencesData);
      setIsStale(false);

    } catch (err) {
      console.error('Error fetching user preferences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user preferences';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, cacheTime, getCacheKey]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to update preferences');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        throw updateError;
      }

      // Update cache with new data
      const cacheKey = getCacheKey();
      userPreferencesCache.set(cacheKey, {
        data: data,
        timestamp: Date.now(),
      });

      setPreferences(data);
      setIsStale(false);
      toast.success('Preferences updated successfully!');
      return true;

    } catch (err) {
      console.error('Error updating user preferences:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, getCacheKey]);

  const invalidateCache = useCallback(() => {
    const cacheKey = getCacheKey();
    userPreferencesCache.delete(cacheKey);
  }, [getCacheKey]);

  // Check if data is stale on mount and when dependencies change
  useEffect(() => {
    const cacheKey = getCacheKey();
    const cached = userPreferencesCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) > cacheTime) {
      setIsStale(true);
    }
    
    if (autoFetch && user) {
      fetchUserPreferences();
    }
  }, [user, autoFetch, fetchUserPreferences, getCacheKey, cacheTime]);

  return {
    preferences,
    loading,
    error,
    refetch: () => fetchUserPreferences(true),
    updatePreferences,
    isStale,
  };
}

// Export the invalidate function for use when preferences might be affected by other operations
export const invalidateUserPreferencesCache = (userId: string) => {
  const cacheKey = `user_preferences_${userId}`;
  userPreferencesCache.delete(cacheKey);
};