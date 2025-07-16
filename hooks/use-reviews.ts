'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface Review {
  id: string;
  user_id: string;
  booking_id: string;
  service_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  // Relations
  services?: {
    id: string;
    name: string;
    image_url: string;
  };
  profiles?: {
    id: string;
    full_name: string;
  };
  bookings?: {
    id: string;
    booking_date: string;
  };
}

interface UseReviewsOptions {
  autoFetch?: boolean;
  serviceId?: string;
  userId?: string;
  minRating?: number;
}

export const useReviews = (options: UseReviewsOptions = {}) => {
  const { autoFetch = true, serviceId, userId, minRating } = options;
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (serviceId) params.append('service_id', serviceId);
      if (userId) params.append('user_id', userId);
      if (minRating) params.append('min_rating', minRating.toString());

      const response = await fetch(`/api/reviews?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(errorMessage);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: {
    booking_id: string;
    service_id: string;
    rating: number;
    comment: string;
  }) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create review');
      }

      // Add new review to local state
      setReviews(prev => [data.data, ...prev]);
      toast.success('Review submitted successfully!');
      
      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getAverageRating = (serviceId?: string) => {
    const serviceReviews = serviceId 
      ? reviews.filter(r => r.service_id === serviceId)
      : reviews;
    
    if (serviceReviews.length === 0) return 0;
    
    const total = serviceReviews.reduce((sum, review) => sum + review.rating, 0);
    return total / serviceReviews.length;
  };

  const getRatingDistribution = (serviceId?: string) => {
    const serviceReviews = serviceId 
      ? reviews.filter(r => r.service_id === serviceId)
      : reviews;
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    serviceReviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    
    return distribution;
  };

  useEffect(() => {
    if (autoFetch) {
      fetchReviews();
    }
  }, [autoFetch, serviceId, userId, minRating]);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    createReview,
    getAverageRating,
    getRatingDistribution,
    refetch: fetchReviews,
  };
};

// Hook specifically for service reviews
export const useServiceReviews = (serviceId: string) => {
  return useReviews({ serviceId, autoFetch: true });
};

// Hook for user's own reviews
export const useUserReviews = () => {
  const { user } = useAuth();
  return useReviews({ userId: user?.id, autoFetch: !!user });
};