import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { serviceSchema } from '@/lib/validations/booking';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/services - List all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('services')
      .select('*')
      .order('name');

    // Filter by active status
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Filter by category
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: services, error } = await query;

    if (error) {
      logger.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: services,
    });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/services - Create new service (Admin only)
export async function POST(request: NextRequest) {
  try {
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

    // Create service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .insert({
        name,
        description,
        base_price: basePrice,
        price_per_hour: pricePerHour,
        image_url: imageUrl || '',
        category_id: category,
        is_active: isActive,
      })
      .select()
      .single();

    if (serviceError) {
      logger.error('Error creating service:', serviceError);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service created successfully',
    }, { status: 201 });

  } catch (error) {
    logger.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}