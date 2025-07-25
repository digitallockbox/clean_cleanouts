import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BOOKING_STATUSES, TIME_SLOTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
  conflictingBookings?: number;
}

// In-memory cache for availability data
const availabilityCache = new Map<string, { data: any; timestamp: number; expiresAt: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache cleanup interval
let cacheCleanupInterval: NodeJS.Timeout | null = null;

// Start cache cleanup
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

// Initialize cache cleanup
startCacheCleanup();

// Generate cache key
const getCacheKey = (params: any): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as any);
  
  return JSON.stringify(sortedParams);
};

// Get from cache
const getFromCache = (key: string): any | null => {
  const entry = availabilityCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  if (entry) {
    availabilityCache.delete(key); // Remove expired entry
  }
  return null;
};

// Set in cache
const setInCache = (key: string, data: any) => {
  const now = Date.now();
  availabilityCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + CACHE_DURATION,
  });
};

// Optimized function to get bookings for multiple dates
const getBookingsForDates = async (
  dates: string[],
  serviceId?: string,
  excludeBookingId?: string
) => {
  let bookingsQuery = supabase
    .from('bookings')
    .select('id, start_time, end_time, duration, service_id, booking_date')
    .in('booking_date', dates)
    .neq('status', BOOKING_STATUSES.CANCELLED);

  if (excludeBookingId) {
    bookingsQuery = bookingsQuery.neq('id', excludeBookingId);
  }

  if (serviceId) {
    bookingsQuery = bookingsQuery.eq('service_id', serviceId);
  }

  const { data: bookings, error } = await bookingsQuery;

  if (error) {
    throw new Error('Failed to fetch bookings');
  }

  // Group bookings by date for faster lookup
  const bookingsByDate = new Map<string, any[]>();
  bookings?.forEach(booking => {
    const date = booking.booking_date;
    if (!bookingsByDate.has(date)) {
      bookingsByDate.set(date, []);
    }
    bookingsByDate.get(date)!.push(booking);
  });

  return bookingsByDate;
};

// Optimized function to calculate availability for a single date
const calculateDateAvailability = (
  date: string,
  duration: number,
  existingBookings: any[] = []
): { availability: TimeSlot[]; summary: any } => {
  const availability: TimeSlot[] = TIME_SLOTS.map((timeSlot) => {
    const [startHour, startMinute] = timeSlot.split(':').map(Number);
    const endHour = startHour + duration;
    const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

    // Check if end time is within business hours
    if (endHour > 18) {
      return {
        time: timeSlot,
        available: false,
        reason: 'Extends beyond business hours',
      };
    }

    // Check for conflicts with existing bookings
    const conflicts = existingBookings.filter((booking) => {
      const bookingStart = booking.start_time;
      const bookingEnd = booking.end_time;

      return (
        (timeSlot >= bookingStart && timeSlot < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (timeSlot <= bookingStart && endTime >= bookingEnd)
      );
    });

    const isAvailable = conflicts.length === 0;

    return {
      time: timeSlot,
      available: isAvailable,
      reason: !isAvailable ? 'Time slot already booked' : undefined,
      conflictingBookings: conflicts.length,
    };
  });

  const availableSlots = availability.filter(slot => slot.available).length;
  const totalSlots = availability.length;

  return {
    availability,
    summary: {
      totalSlots,
      availableSlots,
      bookedSlots: totalSlots - availableSlots,
      availabilityPercentage: Math.round((availableSlots / totalSlots) * 100),
    },
  };
};

// GET /api/availability - Check availability for a specific date and service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');
    const duration = parseInt(searchParams.get('duration') || '2');
    const excludeBookingId = searchParams.get('exclude_booking_id');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Validate date format and ensure it's not in the past
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json({ error: 'Cannot check availability for past dates' }, { status: 400 });
    }

    // Create cache key
    const cacheParams = {
      date,
      serviceId: serviceId || 'all',
      duration,
      excludeBookingId: excludeBookingId || 'none',
    };
    const cacheKey = getCacheKey(cacheParams);

    // Check cache first
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
      });
    }

    // Get bookings for the date
    const bookingsByDate = await getBookingsForDates([date], serviceId || undefined, excludeBookingId || undefined);
    const existingBookings = bookingsByDate.get(date) || [];

    // Calculate availability
    const { availability, summary } = calculateDateAvailability(date, duration, existingBookings);

    // Get service-specific information if service ID is provided
    let serviceInfo = null;
    if (serviceId) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('id, name, base_price, price_per_hour')
        .eq('id', serviceId)
        .single();

      if (!serviceError && service) {
        serviceInfo = service;
      }
    }

    const result = {
      date,
      serviceId,
      duration,
      availability,
      summary,
      serviceInfo,
    };

    // Cache the result
    setInCache(cacheKey, result);

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/availability - Bulk check availability for multiple dates (OPTIMIZED)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dates, serviceId, duration = 2 } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'Dates array is required' }, { status: 400 });
    }

    if (dates.length > 30) {
      return NextResponse.json({ error: 'Cannot check more than 30 dates at once' }, { status: 400 });
    }

    // Create cache key for bulk request
    const cacheParams = {
      dates: dates.sort(), // Sort for consistent cache keys
      serviceId: serviceId || 'all',
      duration,
    };
    const cacheKey = getCacheKey(cacheParams);

    // Check cache first
    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out past dates and prepare valid dates
    const validDates = dates.filter(date => {
      const requestedDate = new Date(date);
      return requestedDate >= today;
    });

    interface DateAvailabilityResult {
      date: string;
      available: boolean;
      reason?: string;
      availableSlots: number;
      totalSlots: number;
      availabilityPercentage: number;
    }

    const results: DateAvailabilityResult[] = [];

    // Add past dates to results immediately
    dates.forEach(date => {
      const requestedDate = new Date(date);
      if (requestedDate < today) {
        results.push({
          date,
          available: false,
          reason: 'Past date',
          availableSlots: 0,
          totalSlots: TIME_SLOTS.length,
          availabilityPercentage: 0,
        });
      }
    });

    if (validDates.length > 0) {
      // Get all bookings for valid dates in a single query (OPTIMIZED)
      const bookingsByDate = await getBookingsForDates(validDates, serviceId);

      // Process each valid date
      validDates.forEach(date => {
        const existingBookings = bookingsByDate.get(date) || [];
        
        // Calculate availability using optimized function
        const { summary } = calculateDateAvailability(date, duration, existingBookings);

        results.push({
          date,
          available: summary.availableSlots > 0,
          availableSlots: summary.availableSlots,
          totalSlots: summary.totalSlots,
          availabilityPercentage: summary.availabilityPercentage,
        });
      });
    }

    // Sort results by date to maintain order
    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Cache the result
    setInCache(cacheKey, results);

    return NextResponse.json({
      success: true,
      data: results,
      performance: {
        totalDates: dates.length,
        validDates: validDates.length,
        pastDates: dates.length - validDates.length,
        cached: false,
      },
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/availability - Clear cache for specific date/service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('service_id');
    
    if (date) {
      // Clear cache for specific date
      const keysToDelete: string[] = [];
      
      availabilityCache.forEach((entry, key) => {
        try {
          const keyObj = JSON.parse(key);
          
          // Clear single date cache entries
          if (keyObj.date === date) {
            if (!serviceId || keyObj.serviceId === serviceId || keyObj.serviceId === 'all') {
              keysToDelete.push(key);
            }
          }
          
          // Clear bulk cache entries that contain this date
          if (keyObj.dates && Array.isArray(keyObj.dates) && keyObj.dates.includes(date)) {
            if (!serviceId || keyObj.serviceId === serviceId || keyObj.serviceId === 'all') {
              keysToDelete.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON key, skip
        }
      });
      
      keysToDelete.forEach(key => availabilityCache.delete(key));
      logger.info(`Cleared ${keysToDelete.length} cache entries for date ${date}${serviceId ? ` and service ${serviceId}` : ''}`);
    } else {
      // Clear all cache
      availabilityCache.clear();
      logger.info('Cleared all availability cache');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    logger.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}