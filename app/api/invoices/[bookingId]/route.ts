
// import { NextRequest, NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase';
// import { generateInvoicePDF } from '@/lib/pdf-generator';

// export async function GET(
//   req: NextRequest,
//   { params }: { params: { bookingId: string } }
// ) {
//   const { bookingId } = params;

//   const { data: booking, error } = await supabase
//     .from('bookings')
//     .select('*, services(*), profiles(*)')
//     .eq('id', bookingId)
//     .single();

//   if (error || !booking) {
//     return new NextResponse('Error fetching booking', { status: 500 });
//   }

//   const invoiceData = {
//     invoiceNumber: booking.id,
//     customerName: booking.profiles.full_name,
//     serviceName: booking.services.name,
//     bookingDate: new Date(booking.start_time).toLocaleDateString(),
//     amount: booking.total_amount,
//     status: booking.status,
//   };

//   const pdfBlob = generateInvoicePDF(invoiceData);

//   return new NextResponse(pdfBlob, {
//     headers: {
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': `attachment; filename="invoice-${booking.id}.pdf"`,
//     },
//   });
// }
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePDF, InvoiceData } from '@/lib/pdf-generator';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          description,
          base_price,
          price_per_hour
        ),
        profiles (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get website settings for company information
    const { data: settings } = await supabase
      .from('website_settings')
      .select('*')
      .single();

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${booking.id.slice(-8).toUpperCase()}`,
      bookingId: booking.id,
      customerName: booking.customer_info?.full_name || booking.profiles?.full_name || 'N/A',
      customerEmail: booking.customer_info?.email || booking.profiles?.email || 'N/A',
      customerPhone: booking.customer_info?.phone || booking.profiles?.phone,
      customerAddress: booking.customer_info?.address,
      serviceName: booking.services?.name || 'Service',
      serviceDescription: booking.services?.description,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      duration: booking.duration || 2,
      basePrice: booking.services?.base_price || 0,
      laborCost: (booking.services?.price_per_hour || 0) * (booking.duration || 2),
      totalAmount: booking.total_price,
      paymentStatus: booking.payment_status,
      bookingStatus: booking.status,
      notes: booking.notes,
      companyName: settings?.company_name || 'CleanOuts Pro',
      companyAddress: settings?.company_address || '123 Business St, City, State 12345',
      companyPhone: settings?.company_phone || '(555) 123-4567',
      companyEmail: settings?.company_email || 'info@cleanoutspro.com',
      invoiceDate: new Date().toISOString(),
    };

    // Generate PDF
    const pdfBlob = generateInvoicePDF(invoiceData);
    
    // Convert blob to buffer for response
    const buffer = await pdfBlob.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId } = params;
    const { action } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Get booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          name,
          description,
          base_price,
          price_per_hour
        ),
        profiles (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get website settings for company information
    const { data: settings } = await supabase
      .from('website_settings')
      .select('*')
      .single();

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${booking.id.slice(-8).toUpperCase()}`,
      bookingId: booking.id,
      customerName: booking.customer_info?.full_name || booking.profiles?.full_name || 'N/A',
      customerEmail: booking.customer_info?.email || booking.profiles?.email || 'N/A',
      customerPhone: booking.customer_info?.phone || booking.profiles?.phone,
      customerAddress: booking.customer_info?.address,
      serviceName: booking.services?.name || 'Service',
      serviceDescription: booking.services?.description,
      bookingDate: booking.booking_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      duration: booking.duration || 2,
      basePrice: booking.services?.base_price || 0,
      laborCost: (booking.services?.price_per_hour || 0) * (booking.duration || 2),
      totalAmount: booking.total_price,
      paymentStatus: booking.payment_status,
      bookingStatus: booking.status,
      notes: booking.notes,
      companyName: settings?.company_name || 'CleanOuts Pro',
      companyAddress: settings?.company_address || '123 Business St, City, State 12345',
      companyPhone: settings?.company_phone || '(555) 123-4567',
      companyEmail: settings?.company_email || 'info@cleanoutspro.com',
      invoiceDate: new Date().toISOString(),
    };

    if (action === 'get-data') {
      return NextResponse.json({ 
        success: true, 
        data: invoiceData 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Invoice API error:', error);
    return NextResponse.json({ error: 'Failed to process invoice request' }, { status: 500 });
  }
}
