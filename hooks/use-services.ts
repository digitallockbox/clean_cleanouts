'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Service, ServiceFilters } from '@/lib/types';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseServicesOptions {
  filters?: ServiceFilters;
  includeInactive?: boolean;
  autoFetch?: boolean;
}

interface UseServicesReturn {
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createService: (serviceData: any) => Promise<Service | null>;
  updateService: (id: string, updates: any) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
}

export function useServices(options: UseServicesOptions = {}): UseServicesReturn {
  const { filters, includeInactive = false, autoFetch = true } = options;
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('services')
        .select('*')
        .order('name');

      // Filter by active status
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      // Apply filters
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.price_min !== undefined) {
        query = query.gte('base_price', filters.price_min);
      }

      if (filters?.price_max !== undefined) {
        query = query.lte('base_price', filters.price_max);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setServices(data || []);

    } catch (err) {
      logger.error('Error fetching services:', err);
      setError('Failed to fetch services');
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: any): Promise<Service | null> => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create service');
      }

      toast.success('Service created successfully!');
      await fetchServices(); // Refresh the list
      return result.data;

    } catch (err) {
      logger.error('Error creating service:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create service');
      return null;
    }
  };

  const updateService = async (id: string, updates: any): Promise<Service | null> => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update service');
      }

      toast.success('Service updated successfully!');
      await fetchServices(); // Refresh the list
      return result.data;

    } catch (err) {
      logger.error('Error updating service:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update service');
      return null;
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete service');
      }

      toast.success('Service deleted successfully!');
      await fetchServices(); // Refresh the list
      return true;

    } catch (err) {
      logger.error('Error deleting service:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete service');
      return false;
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchServices();
    }
  }, [JSON.stringify(filters), includeInactive]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    createService,
    updateService,
    deleteService,
  };
}

// Hook for getting a single service
export function useService(id: string) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchService = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setService(data);

    } catch (err) {
      logger.error('Error fetching service:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [id]);

  return {
    service,
    loading,
    error,
    refetch: fetchService,
  };
}

// Hook for checking service availability - Updated to use new availability API
export function useServiceAvailability(serviceId: string, date?: Date, duration: number = 2) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const checkAvailability = async () => {
    if (!serviceId || !date) {
      setAvailability([]);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        date: date.toISOString().split('T')[0],
        service_id: serviceId,
        duration: duration.toString(),
      });

      const response = await fetch(`/api/availability?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability');
      }

      setAvailability(result.data.availability || []);
      setSummary(result.data.summary || null);

    } catch (err) {
      logger.error('Error checking availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to check availability');
      setAvailability([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAvailability();
  }, [serviceId, date, duration]);

  return {
    availability,
    loading,
    error,
    summary,
    refetch: checkAvailability,
  };
}