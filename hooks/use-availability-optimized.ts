'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { registerCacheInvalidator, unregisterCacheInvalidator } from '@/lib/utils/availability-cache';
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

interface CacheEntry {
  data: AvailabilityData | DateAvailability[];
  timestamp: number;
  expiresAt: number;
}

interface UseOptimizedAvailabilityOptions {
  autoFetch?: boolean;
  date?: Date;
  serviceId?: string;
  duration?: number;
  excludeBookingId?: string;
  cacheTimeout?: number; // Cache timeout in milliseconds (default: 5 minutes)
  debounceDelay?: number; // Debounce delay in milliseconds (default: 300ms)
  preloadDays?: number; // Number of days to preload (default: 14)
}

// Global cache for availability data
const availabilityCache = new Map<string, CacheEntry>();

// Cache cleanup interval
let cacheCleanupInterval: NodeJS.Timeout | null = null;

// Start cache cleanup if not already running
const startCacheCleanup = () => {
  if (!cacheCleanupInterval) {
    cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      availabilityCache.forEach((entry, key) => {
        if (now > entry.expiresAt) {
          availabilityCache.delete(key);
        }
      });
    }, 60000); // Cleanup every minute
  }
};

// Generate cache key
const getCacheKey = (type: 'single' | 'bulk', params: any): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as any);
  
  return `${type}:${JSON.stringify(sortedParams)}`;
};

// Get data from cache
const getFromCache = <T>(key: string): T | null => {
  const entry = availabilityCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  if (entry) {
    availabilityCache.delete(key); // Remove expired entry
  }
  return null;
};

// Set data in cache
const setInCache = (key: string, data: any, cacheTimeout: number) => {
  const now = Date.now();
  availabilityCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + cacheTimeout,
  });
};

export const useOptimizedAvailability = (options: UseOptimizedAvailabilityOptions = {}) => {
  const {
    autoFetch = false,
    date,
    serviceId,
    duration = 2,
    excludeBookingId,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    debounceDelay = 300,
    preloadDays = 14,
  } = options;

  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preloadedData, setPreloadedData] = useState<Map<string, DateAvailability>>(new Map());

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Start cache cleanup
  useEffect(() => {
    startCacheCleanup();
    return () => {
      if (cacheCleanupInterval) {
        clearInterval(cacheCleanupInterval);
        cacheCleanupInterval = null;
      }
    };
  }, []);

  // Fetch single date availability with caching
  const fetchAvailability = useCallback(async (
    targetDate?: Date,
    targetServiceId?: string,
    targetDuration?: number,
    targetExcludeBookingId?: string,
    skipCache = false
  ) => {
    const checkDate = targetDate || date;
    if (!checkDate) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const params = {
      date: checkDate.toISOString().split('T')[0],
      duration: targetDuration || duration,
      serviceId: targetServiceId || serviceId,
      excludeBookingId: targetExcludeBookingId || excludeBookingId,
    };

    const cacheKey = getCacheKey('single', params);

    // Check cache first
    if (!skipCache) {
      const cachedData = getFromCache<AvailabilityData>(cacheKey);
      if (cachedData) {
        setAvailability(cachedData);
        setError(null);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();
      
      const searchParams = new URLSearchParams({
        date: params.date,
        duration: params.duration.toString(),
      });

      if (params.serviceId) {
        searchParams.append('service_id', params.serviceId);
      }

      if (params.excludeBookingId) {
        searchParams.append('exclude_booking_id', params.excludeBookingId);
      }

      const response = await fetch(`/api/availability?${searchParams.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch availability');
      }

      // Cache the result
      setInCache(cacheKey, result.data, cacheTimeout);
      setAvailability(result.data);
      return result.data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch availability';
      setError(errorMessage);
      logger.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  }, [date, serviceId, duration, excludeBookingId, cacheTimeout]);

  // Debounced fetch availability
  const debouncedFetchAvailability = useCallback((
    targetDate?: Date,
    targetServiceId?: string,
    targetDuration?: number,
    targetExcludeBookingId?: string
  ) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchAvailability(targetDate, targetServiceId, targetDuration, targetExcludeBookingId);
    }, debounceDelay);
  }, [fetchAvailability, debounceDelay]);

  // Bulk availability check with caching
  const checkBulkAvailability = useCallback(async (
    dates: Date[],
    targetServiceId?: string,
    targetDuration?: number,
    skipCache = false
  ): Promise<DateAvailability[]> => {
    const params = {
      dates: dates.map(d => d.toISOString().split('T')[0]),
      serviceId: targetServiceId || serviceId,
      duration: targetDuration || duration,
    };

    const cacheKey = getCacheKey('bulk', params);

    // Check cache first
    if (!skipCache) {
      const cachedData = getFromCache<DateAvailability[]>(cacheKey);
      if (cachedData) {
        // Update preloaded data
        const newPreloadedData = new Map(preloadedData);
        cachedData.forEach(item => {
          newPreloadedData.set(item.date, item);
        });
        setPreloadedData(newPreloadedData);
        return cachedData;
      }
    }

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check bulk availability');
      }

      // Cache the result
      setInCache(cacheKey, result.data, cacheTimeout);

      // Update preloaded data
      const newPreloadedData = new Map(preloadedData);
      result.data.forEach((item: DateAvailability) => {
        newPreloadedData.set(item.date, item);
      });
      setPreloadedData(newPreloadedData);

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bulk availability';
      toast.error(errorMessage);
      throw err;
    }
  }, [serviceId, duration, cacheTimeout, preloadedData]);

  // Preload availability data for upcoming dates
  const preloadAvailability = useCallback(async (
    targetServiceId?: string,
    targetDuration?: number
  ) => {
    if (!targetServiceId && !serviceId) return;

    const dates = Array.from({ length: preloadDays }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1); // Start from tomorrow
      return date;
    });

    try {
      await checkBulkAvailability(dates, targetServiceId, targetDuration, false);
    } catch (error) {
      logger.error('Error preloading availability:', error);
      // Don't show error to user for background preloading
    }
  }, [serviceId, preloadDays, checkBulkAvailability]);

  // Get availability from preloaded data
  const getPreloadedAvailability = useCallback((date: Date): DateAvailability | null => {
    const dateString = date.toISOString().split('T')[0];
    return preloadedData.get(dateString) || null;
  }, [preloadedData]);

  // Check if date is available (quick check from preloaded data)
  const isDateAvailable = useCallback((date: Date): boolean | null => {
    const preloaded = getPreloadedAvailability(date);
    return preloaded ? preloaded.available : null;
  }, [getPreloadedAvailability]);

  // Get available slots count for a date (quick check from preloaded data)
  const getAvailableSlots = useCallback((date: Date): number | null => {
    const preloaded = getPreloadedAvailability(date);
    return preloaded ? preloaded.availableSlots : null;
  }, [getPreloadedAvailability]);

  // Utility functions
  const isTimeSlotAvailable = useCallback((timeSlot: string): boolean => {
    if (!availability) return false;
    const slot = availability.availability.find(s => s.time === timeSlot);
    return slot?.available || false;
  }, [availability]);

  const getAvailableTimeSlots = useCallback((): TimeSlot[] => {
    if (!availability) return [];
    return availability.availability.filter(slot => slot.available);
  }, [availability]);

  const getUnavailableTimeSlots = useCallback((): TimeSlot[] => {
    if (!availability) return [];
    return availability.availability.filter(slot => !slot.available);
  }, [availability]);

  const getNextAvailableSlot = useCallback((): TimeSlot | null => {
    const availableSlots = getAvailableTimeSlots();
    return availableSlots.length > 0 ? availableSlots[0] : null;
  }, [getAvailableTimeSlots]);

  const refreshAvailability = useCallback(() => {
    fetchAvailability(undefined, undefined, undefined, undefined, true);
  }, [fetchAvailability]);

  // Clear cache for specific parameters
  const clearCache = useCallback((
    targetDate?: Date,
    targetServiceId?: string,
    targetDuration?: number
  ) => {
    if (targetDate) {
      const params = {
        date: targetDate.toISOString().split('T')[0],
        duration: targetDuration || duration,
        serviceId: targetServiceId || serviceId,
        excludeBookingId,
      };
      const cacheKey = getCacheKey('single', params);
      availabilityCache.delete(cacheKey);
      
      // Also clear bulk cache entries that might contain this date
      const dateString = targetDate.toISOString().split('T')[0];
      availabilityCache.forEach((entry, key) => {
        if (key.includes('bulk:') && key.includes(dateString)) {
          availabilityCache.delete(key);
        }
      });
      
      // Remove from preloaded data
      const newPreloadedData = new Map(preloadedData);
      newPreloadedData.delete(dateString);
      setPreloadedData(newPreloadedData);
    } else {
      // Clear all cache entries
      availabilityCache.clear();
      setPreloadedData(new Map());
    }
  }, [duration, serviceId, excludeBookingId, preloadedData]);

  // Global function to invalidate availability cache (for use after booking creation)
  const invalidateAvailabilityCache = useCallback((
    bookingDate?: Date,
    bookingServiceId?: string
  ) => {
    if (bookingDate) {
      // Clear cache for the specific date and service
      clearCache(bookingDate, bookingServiceId);
      
      // If this is the currently selected date, refresh the availability
      if (date && date.toISOString().split('T')[0] === bookingDate.toISOString().split('T')[0]) {
        fetchAvailability(bookingDate, bookingServiceId, undefined, undefined, true);
      }
    } else {
      // Clear all cache
      clearCache();
    }
  }, [clearCache, date, fetchAvailability]);

  // Auto-fetch effect
  useEffect(() => {
    if (autoFetch && date) {
      debouncedFetchAvailability();
    }
  }, [autoFetch, date, serviceId, duration, excludeBookingId, debouncedFetchAvailability]);

  // Preload effect when service changes
  useEffect(() => {
    if (serviceId) {
      preloadAvailability(serviceId, duration);
    }
  }, [serviceId, duration, preloadAvailability]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    availability,
    loading,
    error,
    preloadedData,
    fetchAvailability: debouncedFetchAvailability,
    checkBulkAvailability,
    preloadAvailability,
    isTimeSlotAvailable,
    getAvailableTimeSlots,
    getUnavailableTimeSlots,
    getNextAvailableSlot,
    refreshAvailability,
    clearCache,
    // Quick access functions for preloaded data
    isDateAvailable,
    getAvailableSlots,
    getPreloadedAvailability,
    // Cache statistics
    getCacheSize: () => availabilityCache.size,
    getCacheKeys: () => Array.from(availabilityCache.keys()),
  };
};

// Hook for optimized bulk availability checking
export const useOptimizedBulkAvailability = (cacheTimeout = 5 * 60 * 1000) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async (
    dates: Date[],
    serviceId?: string,
    duration: number = 2,
    skipCache = false
  ): Promise<DateAvailability[]> => {
    const params = {
      dates: dates.map(d => d.toISOString().split('T')[0]),
      serviceId,
      duration,
    };

    const cacheKey = getCacheKey('bulk', params);

    // Check cache first
    if (!skipCache) {
      const cachedData = getFromCache<DateAvailability[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability');
      }

      // Cache the result
      setInCache(cacheKey, result.data, cacheTimeout);

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheTimeout]);

  return {
    checkAvailability,
    loading,
    error,
  };
};

// Hook for real-time availability checking with optimization
export const useOptimizedRealTimeAvailability = (
  serviceId?: string,
  duration: number = 2,
  options: Omit<UseOptimizedAvailabilityOptions, 'serviceId' | 'duration'> = {}
) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  
  const {
    availability,
    loading,
    fetchAvailability,
    isDateAvailable,
    getAvailableSlots,
    preloadedData,
  } = useOptimizedAvailability({
    ...options,
    autoFetch: false,
    serviceId,
    duration,
  });

  const checkDateAvailability = useCallback(async (date: Date) => {
    setSelectedDate(date);
    
    // First check if we have preloaded data
    const preloaded = getAvailableSlots(date);
    if (preloaded !== null) {
      // We have basic availability info, but still fetch detailed time slots
      await fetchAvailability(date, serviceId, duration);
    } else {
      // No preloaded data, fetch normally
      await fetchAvailability(date, serviceId, duration);
    }
  }, [fetchAvailability, serviceId, duration, getAvailableSlots]);

  const isDateFullyBooked = useCallback((): boolean => {
    if (availability) {
      return availability.summary.availableSlots === 0;
    }
    
    // Fallback to preloaded data
    if (selectedDate) {
      const slots = getAvailableSlots(selectedDate);
      return slots === 0;
    }
    
    return false;
  }, [availability, selectedDate, getAvailableSlots]);

  const getAvailabilityPercentage = useCallback((): number => {
    if (availability) {
      return availability.summary.availabilityPercentage;
    }
    
    // Fallback to preloaded data
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const preloaded = preloadedData.get(dateString);
      return preloaded?.availabilityPercentage || 0;
    }
    
    return 0;
  }, [availability, selectedDate, preloadedData]);

  return {
    selectedDate,
    availability,
    loading,
    checkDateAvailability,
    isDateFullyBooked,
    getAvailabilityPercentage,
    isDateAvailable: selectedDate ? isDateAvailable(selectedDate) : null,
    availableSlots: selectedDate ? getAvailableSlots(selectedDate) : null,
  };
};