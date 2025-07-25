import { logger } from '@/lib/logger';
/**
 * Global availability cache management utilities
 * This module provides functions to invalidate availability cache across the application
 */

// Global cache invalidation functions
let globalCacheInvalidators: Array<(date?: Date, serviceId?: string) => void> = [];

/**
 * Register a cache invalidation function
 */
export function registerCacheInvalidator(invalidator: (date?: Date, serviceId?: string) => void) {
  globalCacheInvalidators.push(invalidator);
}

/**
 * Unregister a cache invalidation function
 */
export function unregisterCacheInvalidator(invalidator: (date?: Date, serviceId?: string) => void) {
  globalCacheInvalidators = globalCacheInvalidators.filter(fn => fn !== invalidator);
}

/**
 * Invalidate availability cache globally
 * This should be called after booking creation, update, or cancellation
 */
export function invalidateAvailabilityCache(bookingDate?: Date, serviceId?: string) {
  logger.info('Invalidating availability cache for:', { bookingDate, serviceId });
  
  // Call all registered invalidators
  globalCacheInvalidators.forEach(invalidator => {
    try {
      invalidator(bookingDate, serviceId);
    } catch (error) {
      logger.error('Error in cache invalidator:', error);
    }
  });
}

/**
 * Clear all availability cache
 */
export function clearAllAvailabilityCache() {
  logger.info('Clearing all availability cache');
  
  globalCacheInvalidators.forEach(invalidator => {
    try {
      invalidator(); // Call without parameters to clear all
    } catch (error) {
      logger.error('Error in cache invalidator:', error);
    }
  });
}

/**
 * Invalidate cache for a specific date range
 */
export function invalidateAvailabilityCacheForDateRange(
  startDate: Date, 
  endDate: Date, 
  serviceId?: string
) {
  logger.info('Invalidating availability cache for date range:', { startDate, endDate, serviceId });
  
  // Generate all dates in the range
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Invalidate cache for each date
  dates.forEach(date => {
    invalidateAvailabilityCache(date, serviceId);
  });
}