'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Booking, BookingFilters } from '@/lib/types';
import { useAuth } from './use-auth';
import { invalidatePaymentHistoryCache } from './use-payment-history';
import { invalidateUserPreferencesCache } from './use-user-preferences';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseBookingsOptions {
  filters?: BookingFilters;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
  cacheTime?: number; // Cache duration in milliseconds
}

interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  refetch: () => Promise<void>;
  createBooking: (bookingData: any) => Promise<Booking | null>;
  updateBooking: (id: string, updates: any) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<boolean>;
  isStale: boolean;
}

// Global cache for bookings data
const bookingsCache = new Map<string, {
  data: Booking[];
  totalCount: number;
  timestamp: number;
  filters: string;
}>();

export function useBookings(options: UseBookingsOptions = {}): UseBookingsReturn {
  const { filters, page = 1, limit = 10, autoFetch = true, cacheTime = 5 * 60 * 1000 } = options; // 5 minutes default cache
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [isStale, setIsStale] = useState(false);
  
  const lastFetchRef = useRef<number>(0);
  const filtersStringRef = useRef<string>('');

  const getCacheKey = useCallback(() => {
    const filtersString = JSON.stringify({ filters, page: currentPage, limit, userId: user?.id });
    return `bookings_${user?.id}_${filtersString}`;
  }, [filters, currentPage, limit, user?.id]);

  const fetchBookings = useCallback(async (forceRefresh = false) => {
    if (!user) {
      logger.info('No user found, skipping booking fetch');
      return;
    }

    const cacheKey = getCacheKey();
    const now = Date.now();
    const cached = bookingsCache.get(cacheKey);
    
    // Check if we have valid cached data and don't need to force refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < cacheTime) {
      logger.info('Using cached bookings data');
      setBookings(cached.data);
      setTotalCount(cached.totalCount);
      setIsStale(false);
      return;
    }

    // Check if we should skip fetching if we just fetched recently (prevent rapid refetches)
    if (!forceRefresh && (now - lastFetchRef.current) < 1000) {
      logger.info('Skipping fetch - too recent');
      return;
    }

    logger.info('Fetching bookings for user:', user.id);
    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      // First, verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        logger.error('No valid session found:', sessionError);
        throw new Error('Authentication required');
      }

      logger.info('Valid session found, proceeding with query');

      let query = supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            name,
            description,
            base_price,
            price_per_hour,
            image_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.payment_status && filters.payment_status.length > 0) {
        query = query.in('payment_status', filters.payment_status);
      }

      if (filters?.date_from) {
        query = query.gte('booking_date', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('booking_date', filters.date_to);
      }

      if (filters?.service_id) {
        query = query.eq('service_id', filters.service_id);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      } else {
        // Non-admin users can only see their own bookings
        const isAdmin = user.email === 'admin@cleanouts.com' ||
                       (user.user_metadata as any)?.role === 'admin';
        
        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }
      }

      // Apply pagination
      const from = (currentPage - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      logger.info('Executing query with filters:', { 
        userId: user.id, 
        isAdmin: user.email === 'admin@cleanouts.com',
        filters 
      });

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        logger.error('Supabase query error:', fetchError);
        throw fetchError;
      }

      logger.info('Query successful. Found bookings:', data?.length || 0);
      logger.info('Total count:', count);

      const bookingsData = data || [];
      const totalCountData = count || 0;

      // Cache the results
      bookingsCache.set(cacheKey, {
        data: bookingsData,
        totalCount: totalCountData,
        timestamp: now,
        filters: JSON.stringify(filters)
      });

      setBookings(bookingsData);
      setTotalCount(totalCountData);
      setIsStale(false);

    } catch (err) {
      logger.error('Error fetching bookings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, filters, currentPage, limit, cacheTime, getCacheKey]);

  const invalidateCache = useCallback(() => {
    // Clear all cache entries for this user
    const keysToDelete: string[] = [];
    bookingsCache.forEach((_, key) => {
      if (key.includes(`bookings_${user?.id}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => bookingsCache.delete(key));
    
    // Also invalidate related caches since bookings affect payments and potentially preferences
    if (user?.id) {
      invalidatePaymentHistoryCache(user.id);
      // Note: We don't invalidate preferences cache here as bookings don't directly affect preferences
      // invalidateUserPreferencesCache(user.id);
    }
  }, [user?.id]);

  const createBooking = async (bookingData: any): Promise<Booking | null> => {
    if (!user) {
      toast.error('You must be logged in to create a booking');
      return null;
    }

    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('Booking creation failed:', result);
        if (result.details) {
          logger.error('Validation details:', result.details);
        }
        throw new Error(result.error || 'Failed to create booking');
      }

      toast.success('Booking created successfully!');
      invalidateCache(); // Clear cache
      await fetchBookings(true); // Force refresh
      return result.data;

    } catch (err) {
      logger.error('Error creating booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create booking');
      return null;
    }
  };

  const updateBooking = async (id: string, updates: any): Promise<Booking | null> => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update booking');
      }

      toast.success('Booking updated successfully!');
      invalidateCache(); // Clear cache
      await fetchBookings(true); // Force refresh
      return result.data;

    } catch (err) {
      logger.error('Error updating booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update booking');
      return null;
    }
  };

  const cancelBooking = async (id: string): Promise<boolean> => {
    try {
      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully!');
      invalidateCache(); // Clear cache
      await fetchBookings(true); // Force refresh
      return true;

    } catch (err) {
      logger.error('Error cancelling booking:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel booking');
      return false;
    }
  };

  // Check if data is stale on mount and when dependencies change
  useEffect(() => {
    const cacheKey = getCacheKey();
    const cached = bookingsCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) > cacheTime) {
      setIsStale(true);
    }
    
    if (autoFetch && user) {
      fetchBookings();
    }
  }, [user, currentPage, JSON.stringify(filters), autoFetch, fetchBookings, getCacheKey, cacheTime]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    bookings,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    refetch: () => fetchBookings(true),
    createBooking,
    updateBooking,
    cancelBooking,
    isStale,
  };
}

// Hook for getting a single booking
export function useBooking(id: string) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch booking');
      }

      setBooking(result.data);

    } catch (err) {
      logger.error('Error fetching booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
  };
}