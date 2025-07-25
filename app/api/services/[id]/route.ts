import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serviceSchema } from '@/lib/validations/booking';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/services/[id] - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories (
          id,
          name,
          description
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      logger.error('Error fetching service:', error);
      return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: service,
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = serviceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const { name, description, basePrice, pricePerHour, imageUrl, category, isActive } = validationResult.data;

    // Check if service exists
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      logger.error('Error fetching service:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }

    // Update service
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update({
        name,
        description,
        base_price: basePrice,
        price_per_hour: pricePerHour,
        image_url: imageUrl || existingService.image_url,
        category_id: category,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        service_categories (
          id,
          name,
          description
        )
      `)
      .single();

    if (updateError) {
      logger.error('Error updating service:', updateError);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedService,
      message: 'Service updated successfully',
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Delete service (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if service exists
    const { data: existingService, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 });
      }
      logger.error('Error fetching service:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
    }

    // Check if service has active bookings
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('service_id', id)
      .in('status', ['pending', 'confirmed'])
      .limit(1);

    if (bookingsError) {
      logger.error('Error checking active bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to check active bookings' }, { status: 500 });
    }

    if (activeBookings && activeBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete service with active bookings. Please complete or cancel existing bookings first.' 
      }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { data: deletedService, error: deleteError } = await supabase
      .from('services')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      logger.error('Error deleting service:', deleteError);
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: deletedService,
      message: 'Service deleted successfully',
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}