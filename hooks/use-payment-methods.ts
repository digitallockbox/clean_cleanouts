'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'bank_account';
  card_last_four?: string;
  card_brand?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  bank_name?: string;
  account_last_four?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UsePaymentMethodsOptions {
  autoFetch?: boolean;
}

export const usePaymentMethods = (options: UsePaymentMethodsOptions = {}) => {
  const { autoFetch = true } = options;
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('payment_methods');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/payment-methods', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods');
      }

      const methods = data.data || [];
      setPaymentMethods(methods);
      // Cache in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('payment_methods', JSON.stringify(methods));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment methods';
      setError(errorMessage);
      logger.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentMethodData: {
    type: 'card' | 'bank_account';
    card_last_four?: string;
    card_brand?: string;
    card_exp_month?: number;
    card_exp_year?: number;
    bank_name?: string;
    account_last_four?: string;
    is_default?: boolean;
    stripe_payment_method_id?: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(paymentMethodData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add payment method');
      }

      // Add new payment method to local state
      setPaymentMethods(prev => {
        const newMethods = [data.data, ...prev];
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('payment_methods', JSON.stringify(newMethods));
        }
        return newMethods;
      });
      toast.success('Payment method added successfully!');
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment method';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment method');
      }

      // Update local state
      setPaymentMethods(prev => {
        const newMethods = prev.map(method =>
          method.id === id ? { ...method, ...data.data } : method
        );
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('payment_methods', JSON.stringify(newMethods));
        }
        return newMethods;
      });

      toast.success('Payment method updated successfully!');
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment method';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment method');
      }

      // Remove from local state
      setPaymentMethods(prev => {
        const newMethods = prev.filter(method => method.id !== id);
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('payment_methods', JSON.stringify(newMethods));
        }
        return newMethods;
      });
      toast.success('Payment method deleted successfully!');
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment method';
      toast.error(errorMessage);
      throw err;
    }
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      await updatePaymentMethod(id, { is_default: true });
      
      // Update local state to reflect new default
      setPaymentMethods(prev => {
        const newMethods = prev.map(method => ({
          ...method,
          is_default: method.id === id,
        }));
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('payment_methods', JSON.stringify(newMethods));
        }
        return newMethods;
      });
    } catch (err) {
      logger.error('Error setting default payment method:', err);
      throw err;
    }
  };

  const getDefaultPaymentMethod = (): PaymentMethod | null => {
    return paymentMethods.find(method => method.is_default) || null;
  };

  const getPaymentMethodDisplay = (method: PaymentMethod): string => {
    if (method.type === 'card') {
      const brand = method.card_brand ? method.card_brand.charAt(0).toUpperCase() + method.card_brand.slice(1) : 'Card';
      return `${brand} ending in ${method.card_last_four}`;
    } else if (method.type === 'bank_account') {
      return `${method.bank_name || 'Bank'} ending in ${method.account_last_four}`;
    }
    return 'Unknown payment method';
  };

  const isExpired = (method: PaymentMethod): boolean => {
    if (method.type !== 'card' || !method.card_exp_month || !method.card_exp_year) {
      return false;
    }
    
    const now = new Date();
    const expiry = new Date(method.card_exp_year, method.card_exp_month - 1);
    return expiry < now;
  };

  useEffect(() => {
    if (autoFetch && user && paymentMethods.length === 0) {
      fetchPaymentMethods();
    }
  }, [autoFetch, user, paymentMethods.length]);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getDefaultPaymentMethod,
    getPaymentMethodDisplay,
    isExpired,
    refetch: fetchPaymentMethods,
  };
};

// Hook for getting a specific payment method
export const usePaymentMethod = (id: string) => {
  const { paymentMethods, loading } = usePaymentMethods();
  const paymentMethod = paymentMethods.find(method => method.id === id);
  
  return {
    paymentMethod,
    loading,
  };
};
