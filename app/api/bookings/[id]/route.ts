import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateBookingSchema } from '@/lib/validations/booking';
import { BOOKING_STATUSES } from '@/lib/constants';

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

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/bookings/[id] - Get single booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get booking with related data
    const { data: booking, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      console.error('Error fetching booking:', error);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/bookings/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = updateBookingSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const updateData = validationResult.data;

    // Check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      console.error('Error fetching booking:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    // Check if booking can be updated
    if (existingBooking.status === BOOKING_STATUSES.COMPLETED || 
        existingBooking.status === BOOKING_STATUSES.CANCELLED) {
      return NextResponse.json({ 
        error: 'Cannot update completed or cancelled bookings' 
      }, { status: 400 });
    }

    // If updating date/time, check for conflicts
    if (updateData.bookingDate || updateData.startTime || updateData.duration) {
      const bookingDate = updateData.bookingDate ? 
        updateData.bookingDate.toISOString().split('T')[0] : 
        existingBooking.booking_date;
      const startTime = updateData.startTime || existingBooking.start_time;
      const duration = updateData.duration || 
        (new Date(`1970-01-01T${existingBooking.end_time}:00`).getTime() - 
         new Date(`1970-01-01T${existingBooking.start_time}:00`).getTime()) / (1000 * 60 * 60);

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const endHour = startHour + duration;
      const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

      // Check for conflicts (excluding current booking)
      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_date', bookingDate)
        .neq('id', id)
        .neq('status', BOOKING_STATUSES.CANCELLED)
        .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({ 
          error: 'Time slot is already booked' 
        }, { status: 409 });
      }

      // Prepare update object with end_time if needed
      const finalUpdateData: any = { ...updateData };
      if (updateData.duration) {
        finalUpdateData.end_time = endTime;
      }
      if (updateData.bookingDate) {
        finalUpdateData.booking_date = updateData.bookingDate.toISOString().split('T')[0];
      }
      if (updateData.startTime) {
        finalUpdateData.start_time = updateData.startTime;
      }
    }

    // Update booking
    const finalUpdateData: any = { ...updateData };
    if (updateData.bookingDate) {
      finalUpdateData.booking_date = updateData.bookingDate.toISOString().split('T')[0];
    }
    if (updateData.startTime) {
      finalUpdateData.start_time = updateData.startTime;
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...finalUpdateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Create notification for booking update
    let notificationMessage = 'Your booking has been updated.';
    if (updateData.status && updateData.status !== existingBooking.status) {
      switch (updateData.status) {
        case BOOKING_STATUSES.CONFIRMED:
          notificationMessage = `Your booking for ${updatedBooking.services?.name} has been confirmed!`;
          break;
        case BOOKING_STATUSES.COMPLETED:
          notificationMessage = `Your booking for ${updatedBooking.services?.name} has been completed. Thank you for choosing our service!`;
          break;
        default:
          notificationMessage = `Your booking status has been updated to ${updateData.status}.`;
      }
    } else if (updateData.bookingDate || updateData.startTime) {
      notificationMessage = `Your booking details have been updated. New date/time: ${updatedBooking.booking_date} at ${updatedBooking.start_time}.`;
    }

    await createNotification(
      updatedBooking.user_id,
      'Booking Updated',
      notificationMessage,
      updateData.status === BOOKING_STATUSES.CONFIRMED ? 'success' : 'info'
    );

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: 'Booking updated successfully',
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      console.error('Error fetching booking:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    // Check if booking can be cancelled
    if (existingBooking.status === BOOKING_STATUSES.COMPLETED) {
      return NextResponse.json({ 
        error: 'Cannot cancel completed bookings' 
      }, { status: 400 });
    }

    if (existingBooking.status === BOOKING_STATUSES.CANCELLED) {
      return NextResponse.json({ 
        error: 'Booking is already cancelled' 
      }, { status: 400 });
    }

    // Cancel booking (soft delete)
    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('bookings')
      .update({
        status: BOOKING_STATUSES.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

    if (cancelError) {
      console.error('Error cancelling booking:', cancelError);
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
    }

    // Create notification for booking cancellation
    await createNotification(
      cancelledBooking.user_id,
      'Booking Cancelled',
      `Your booking for ${cancelledBooking.services?.name} on ${cancelledBooking.booking_date} has been cancelled.`,
      'warning'
    );

    return NextResponse.json({
      success: true,
      data: cancelledBooking,
      message: 'Booking cancelled successfully',
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}