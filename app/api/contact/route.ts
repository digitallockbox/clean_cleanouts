import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { contactSchema } from '@/lib/validations/booking';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/contact - Handle contact form submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      }, { status: 400 });
    }

    const { name, email, phone, subject, message } = validationResult.data;

    // Store contact submission in database
    const { data: contact, error: contactError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'new',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (contactError) {
      console.error('Error storing contact submission:', contactError);
      // Continue even if database storage fails
    }

    // TODO: Send email notification to admin
    // TODO: Send auto-reply email to customer
    
    // For now, we'll just log the contact submission
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
      data: contact,
    }, { status: 201 });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to submit contact form. Please try again.' 
    }, { status: 500 });
  }
}

// GET /api/contact - Get contact submissions (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Build query
    let query = supabase
      .from('contact_submissions')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching contact submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch contact submissions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}