'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  bookings?: {
    id: string;
    service_id: string;
    booking_date: string;
    services?: {
      id: string;
      name: string;
      description: string;
    };
  };
}

interface UsePaymentHistoryOptions {
  autoFetch?: boolean;
  cacheTime?: number; // Cache duration in milliseconds
}

interface UsePaymentHistoryReturn {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Global cache for payment history data
const paymentHistoryCache = new Map<string, {
  data: Payment[];
  timestamp: number;
}>();

export function usePaymentHistory(options: UsePaymentHistoryOptions = {}): UsePaymentHistoryReturn {
  const { autoFetch = true, cacheTime = 10 * 60 * 1000 } = options; // 10 minutes default cache
  const { user } = useAuth();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const lastFetchRef = useRef<number>(0);

  const getCacheKey = useCallback(() => {
    return `payment_history_${user?.id}`;
  }, [user?.id]);

  const fetchPaymentHistory = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('No user found, skipping payment history fetch');
      return;
    }

    const cacheKey = getCacheKey();
    const now = Date.now();
    const cached = paymentHistoryCache.get(cacheKey);
    
    // Check if we have valid cached data and don't need to force refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < cacheTime) {
      console.log('Using cached payment history data');
      setPayments(cached.data);
      setIsStale(false);
      return;
    }

    // Check if we should skip fetching if we just fetched recently (prevent rapid refetches)
    if (!forceRefresh && (now - lastFetchRef.current) < 1000) {
      console.log('Skipping payment history fetch - too recent');
      return;
    }

    console.log('Fetching payment history for user:', user.id);
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

      console.log('Valid session found, proceeding with payment history query');

      // Note: The payments table structure shows it has booking_id, not user_id
      // We need to join through bookings to get user's payments
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select(`
          *,
          bookings!inner (
            id,
            user_id,
            service_id,
            booking_date,
            services (
              id,
              name,
              description
            )
          )
        `)
        .eq('bookings.user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase payment history query error:', fetchError);
        throw fetchError;
      }

      console.log('Payment history query successful. Found payments:', data?.length || 0);

      const paymentsData = data || [];

      // Cache the results
      paymentHistoryCache.set(cacheKey, {
        data: paymentsData,
        timestamp: now,
      });

      setPayments(paymentsData);
      setIsStale(false);

    } catch (err) {
      console.error('Error fetching payment history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, cacheTime, getCacheKey]);

  const invalidateCache = useCallback(() => {
    // Clear cache entry for this user
    const cacheKey = getCacheKey();
    paymentHistoryCache.delete(cacheKey);
  }, [getCacheKey]);

  // Check if data is stale on mount and when dependencies change
  useEffect(() => {
    const cacheKey = getCacheKey();
    const cached = paymentHistoryCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) > cacheTime) {
      setIsStale(true);
    }
    
    if (autoFetch && user) {
      fetchPaymentHistory();
    }
  }, [user, autoFetch, fetchPaymentHistory, getCacheKey, cacheTime]);

  return {
    payments,
    loading,
    error,
    refetch: () => fetchPaymentHistory(true),
    isStale,
  };
}

// Export the invalidate function for use when payments are created/updated
export const invalidatePaymentHistoryCache = (userId: string) => {
  const cacheKey = `payment_history_${userId}`;
  paymentHistoryCache.delete(cacheKey);
};