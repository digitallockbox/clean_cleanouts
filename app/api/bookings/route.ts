import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bookingSchema } from '@/lib/validations/booking';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '@/lib/constants';
import { logger } from '@/lib/logger';

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
    logger.error('Error creating notification:', error);
  }
}

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/bookings - List bookings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');
    const serviceId = searchParams.get('service_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          description,
          base_price,
          price_per_hour,
          image_url
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Non-admin users can only see their own bookings
      const isAdmin = user.email === 'admin@cleanouts.com' ||
                     user.user_metadata?.role === 'admin';
      
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
    }
    
    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }
    
    if (dateFrom) {
      query = query.gte('booking_date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('booking_date', dateTo);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: bookings, error, count } = await query;

    if (error) {
      logger.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    // Check authentication from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Log the incoming request for debugging
    logger.info('Incoming booking request:', JSON.stringify(body, null, 2));
    
    // Convert bookingDate string to Date object if needed
    const processedBody = {
      ...body,
      bookingDate: body.bookingDate ? new Date(body.bookingDate) : undefined,
      duration: typeof body.duration === 'string' ? Number(body.duration) : body.duration,
    };
    
    // Validate input
    const validationResult = bookingSchema.safeParse(processedBody);
    if (!validationResult.success) {
      logger.error('Booking validation failed:', validationResult.error.errors);
      logger.error('Processed body:', JSON.stringify(processedBody, null, 2));
      logger.error('Original body:', JSON.stringify(body, null, 2));
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const { serviceId, bookingDate, startTime, duration, notes, customerInfo } = validationResult.data;

    // Check if service exists
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Calculate end time and total price
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const endHour = startHour + duration;
    const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    const totalPrice = service.base_price + (service.price_per_hour * duration);

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', bookingDate.toISOString().split('T')[0])
      .neq('status', BOOKING_STATUSES.CANCELLED)
      .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ 
        error: 'Time slot is already booked' 
      }, { status: 409 });
    }

    // Create booking with immediate payment required
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        service_id: serviceId,
        booking_date: bookingDate.toISOString().split('T')[0],
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        total_price: totalPrice,
        status: BOOKING_STATUSES.PENDING,
        payment_status: PAYMENT_STATUSES.PENDING, // Will be updated to 'paid' after payment
        notes: notes || null,
        customer_info: {
          full_name: customerInfo.fullName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
        },
      })
      .select(`
        *,
        services (
          id,
          name,
          description,
          base_price,
          price_per_hour,
          image_url
        )
      `)
      .single();

    if (bookingError) {
      logger.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Create notification for the user
    await createNotification(
      user.id,
      'Booking Created Successfully',
      `Your booking for ${service.name} on ${bookingDate.toISOString().split('T')[0]} at ${startTime} has been created and is pending confirmation.`,
      'success'
    );

    return NextResponse.json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    }, { status: 201 });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}