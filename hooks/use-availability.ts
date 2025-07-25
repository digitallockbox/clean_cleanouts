'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
  conflictingBookings?: number;
}

export interface AvailabilityData {
  date: string;
  serviceId?: string;
  duration: number;
  availability: TimeSlot[];
  summary: {
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    availabilityPercentage: number;
  };
  serviceInfo?: {
    id: string;
    name: string;
    base_price: number;
    price_per_hour: number;
  };
}

export interface DateAvailability {
  date: string;
  available: boolean;
  availableSlots: number;
  totalSlots: number;
  availabilityPercentage: number;
  reason?: string;
}

interface UseAvailabilityOptions {
  autoFetch?: boolean;
  date?: Date;
  serviceId?: string;
  duration?: number;
  excludeBookingId?: string;
}

export const useAvailability = (options: UseAvailabilityOptions = {}) => {
  const { autoFetch = false, date, serviceId, duration = 2, excludeBookingId } = options;
  
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async (
    targetDate?: Date,
    targetServiceId?: string,
    targetDuration?: number,
    targetExcludeBookingId?: string
  ) => {
    const checkDate = targetDate || date;
    if (!checkDate) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        date: checkDate.toISOString().split('T')[0],
        duration: (targetDuration || duration).toString(),
      });

      if (targetServiceId || serviceId) {
        params.append('service_id', targetServiceId || serviceId!);
      }

      if (targetExcludeBookingId || excludeBookingId) {
        params.append('exclude_booking_id', targetExcludeBookingId || excludeBookingId!);
      }

      const response = await fetch(`/api/availability?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch availability');
      }

      setAvailability(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch availability';
      setError(errorMessage);
      logger.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkBulkAvailability = async (
    dates: Date[],
    targetServiceId?: string,
    targetDuration?: number
  ): Promise<DateAvailability[]> => {
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: dates.map(d => d.toISOString().split('T')[0]),
          serviceId: targetServiceId || serviceId,
          duration: targetDuration || duration,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check bulk availability');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bulk availability';
      toast.error(errorMessage);
      throw err;
    }
  };

  const isTimeSlotAvailable = (timeSlot: string): boolean => {
    if (!availability) return false;
    const slot = availability.availability.find(s => s.time === timeSlot);
    return slot?.available || false;
  };

  const getAvailableTimeSlots = (): TimeSlot[] => {
    if (!availability) return [];
    return availability.availability.filter(slot => slot.available);
  };

  const getUnavailableTimeSlots = (): TimeSlot[] => {
    if (!availability) return [];
    return availability.availability.filter(slot => !slot.available);
  };

  const getNextAvailableSlot = (): TimeSlot | null => {
    const availableSlots = getAvailableTimeSlots();
    return availableSlots.length > 0 ? availableSlots[0] : null;
  };

  const refreshAvailability = () => {
    fetchAvailability();
  };

  useEffect(() => {
    if (autoFetch && date) {
      fetchAvailability();
    }
  }, [autoFetch, date, serviceId, duration, excludeBookingId]);

  return {
    availability,
    loading,
    error,
    fetchAvailability,
    checkBulkAvailability,
    isTimeSlotAvailable,
    getAvailableTimeSlots,
    getUnavailableTimeSlots,
    getNextAvailableSlot,
    refreshAvailability,
    refetch: refreshAvailability,
  };
};

// Hook for checking availability across multiple dates
export const useBulkAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async (
    dates: Date[],
    serviceId?: string,
    duration: number = 2
  ): Promise<DateAvailability[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: dates.map(d => d.toISOString().split('T')[0]),
          serviceId,
          duration,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkAvailability,
    loading,
    error,
  };
};

// Hook for real-time availability checking during booking
export const useRealTimeAvailability = (serviceId?: string, duration: number = 2) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { availability, loading, fetchAvailability } = useAvailability({
    autoFetch: false,
    serviceId,
    duration,
  });

  const checkDateAvailability = async (date: Date) => {
    setSelectedDate(date);
    await fetchAvailability(date, serviceId, duration);
  };

  const isDateFullyBooked = (): boolean => {
    return availability?.summary.availableSlots === 0;
  };

  const getAvailabilityPercentage = (): number => {
    return availability?.summary.availabilityPercentage || 0;
  };

  return {
    selectedDate,
    availability,
    loading,
    checkDateAvailability,
    isDateFullyBooked,
    getAvailabilityPercentage,
  };
};