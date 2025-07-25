'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ButtonLoading } from '@/components/ui/loading-spinner';
import { useReviews, Review } from '@/hooks/use-reviews';
import { formatDistanceToNow } from 'date-fns';
import { Star, MessageSquare, User } from 'lucide-react';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Review form schema
const reviewFormSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000, 'Comment must be less than 1000 characters'),
});

// Star Rating Component
interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} cursor-pointer transition-colors ${
            star <= (hoverRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        />
      ))}
    </div>
  );
};

// Review Form Component
interface ReviewFormProps {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  bookingId,
  serviceId,
  serviceName,
  onReviewSubmitted,
}) => {
  const { createReview } = useReviews({ autoFetch: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await createReview({
        booking_id: bookingId,
        service_id: serviceId,
        rating: data.rating,
        comment: data.comment,
      });
      
      form.reset();
      onReviewSubmitted?.();
    } catch (error) {
      logger.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Review {serviceName}
        </CardTitle>
        <CardDescription>
          Share your experience to help other customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <StarRating
                        rating={field.value}
                        onRatingChange={field.onChange}
                        size="lg"
                      />
                      <span className="text-sm text-gray-600">
                        {field.value > 0 && `${field.value} star${field.value !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your experience..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              <ButtonLoading isLoading={isSubmitting} loadingText="Submitting...">
                Submit Review
              </ButtonLoading>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Review Display Component
interface ReviewDisplayProps {
  review: Review;
}

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({ review }) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {review.profiles?.full_name || 'Anonymous User'}
            </p>
            <div className="flex items-center space-x-2">
              <StarRating rating={review.rating} readonly size="sm" />
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="outline">
          {review.rating} star{review.rating !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      
      {review.bookings && (
        <p className="text-xs text-gray-500">
          Service date: {new Date(review.bookings.booking_date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

// Reviews List Component
interface ReviewsListProps {
  serviceId?: string;
  showServiceName?: boolean;
  maxReviews?: number;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  serviceId,
  showServiceName = false,
  maxReviews,
}) => {
  const { reviews, loading, getAverageRating, getRatingDistribution } = useReviews({
    serviceId,
    autoFetch: true,
  });

  const displayReviews = maxReviews ? reviews.slice(0, maxReviews) : reviews;
  const averageRating = getAverageRating(serviceId);
  const ratingDistribution = getRatingDistribution(serviceId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">
              Be the first to review this service!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                <StarRating rating={Math.round(averageRating)} readonly />
                <p className="text-sm text-gray-600 mt-1">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex-1 max-w-xs ml-8">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2 mb-1">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${reviews.length > 0 ? (ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayReviews.map((review) => (
          <ReviewDisplay key={review.id} review={review} />
        ))}
      </div>

      {maxReviews && reviews.length > maxReviews && (
        <div className="text-center">
          <Button variant="outline">
            View All {reviews.length} Reviews
          </Button>
        </div>
      )}
    </div>
  );
};