import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Review validation schema
const reviewSchema = z.object({
  booking_id: z.string().uuid(),
  service_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

// Helper function to create notifications
async function createNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      read: false,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// GET /api/reviews - List reviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const serviceId = searchParams.get('service_id');
    const userId = searchParams.get('user_id');
    const minRating = searchParams.get('min_rating');

    // Build query
    let query = supabase
      .from('service_reviews')
      .select(`
        *,
        services (
          id,
          name,
          image_url
        ),
        profiles (
          id,
          full_name
        ),
        bookings (
          id,
          booking_date
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (minRating) {
      query = query.gte('rating', parseInt(minRating));
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('service_reviews')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reviews - Create new review
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = reviewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const { booking_id, service_id, rating, comment } = validationResult.data;

    // Check if booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or access denied' }, { status: 404 });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Can only review completed bookings' 
      }, { status: 400 });
    }

    // Check if review already exists for this booking
    const { data: existingReview } = await supabase
      .from('service_reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('user_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'Review already exists for this booking' 
      }, { status: 409 });
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('service_reviews')
      .insert({
        user_id: user.id,
        booking_id,
        service_id,
        rating,
        comment,
      })
      .select(`
        *,
        services (
          id,
          name,
          image_url
        ),
        profiles (
          id,
          full_name
        ),
        bookings (
          id,
          booking_date
        )
      `)
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    // Create notification for the user
    await createNotification(
      user.id,
      'Review Submitted',
      `Thank you for reviewing ${review.services?.name}! Your feedback helps us improve our services.`,
      'success'
    );

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Review created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}