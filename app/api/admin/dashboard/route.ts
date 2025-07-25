import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/dashboard - Get dashboard analytics
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user!;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    logger.info('Admin accessing dashboard', { 
      userId: user.id, 
      period: parseInt(period) 
    });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get basic stats
    const [
      bookingsResult,
      usersResult,
      servicesResult,
      revenueResult,
      contactsResult
    ] = await Promise.all([
      // Total bookings
      supabase
        .from('bookings')
        .select('id, status, payment_status, total_price, created_at, booking_date'),
      
      // Total users
      supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Active services
      supabase
        .from('services')
        .select('id, name, is_active'),
      
      // Revenue data
      supabase
        .from('bookings')
        .select('total_price, payment_status, created_at, booking_date')
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString()),
      
      // Contact submissions
      supabase
        .from('contact_submissions')
        .select('id, status, submitted_at')
        .gte('submitted_at', startDate.toISOString())
    ]);

    if (bookingsResult.error) throw bookingsResult.error;
    if (usersResult.error) throw usersResult.error;
    if (servicesResult.error) throw servicesResult.error;
    if (revenueResult.error) throw revenueResult.error;
    if (contactsResult.error) throw contactsResult.error;

    const bookings = bookingsResult.data || [];
    const users = usersResult.data || [];
    const services = servicesResult.data || [];
    const revenue = revenueResult.data || [];
    const contacts = contactsResult.data || [];

    // Calculate stats
    const stats = {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      
      totalRevenue: revenue.reduce((sum, b) => sum + (b.total_price || 0), 0),
      pendingRevenue: bookings
        .filter(b => b.payment_status === 'pending')
        .reduce((sum, b) => sum + (b.total_price || 0), 0),
      
      totalUsers: users.length,
      newUsers: users.length, // All users in the period are "new"
      
      activeServices: services.filter(s => s.is_active).length,
      totalServices: services.length,
      
      totalContacts: contacts.length,
      newContacts: contacts.filter(c => c.status === 'new').length,
    };

    // Calculate daily revenue for chart
    const dailyRevenue = [];
    const dailyBookings = [];
    
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = revenue
        .filter(b => b.booking_date === dateStr)
        .reduce((sum, b) => sum + (b.total_price || 0), 0);
      
      const dayBookings = bookings
        .filter(b => b.booking_date === dateStr)
        .length;
      
      dailyRevenue.push({
        date: dateStr,
        revenue: dayRevenue,
        bookings: dayBookings,
      });
    }

    // Service performance
    const servicePerformance = await Promise.all(
      services.map(async (service) => {
        const { data: serviceBookings } = await supabase
          .from('bookings')
          .select('total_price, status')
          .eq('service_id', service.id);

        const bookingCount = serviceBookings?.length || 0;
        const revenue = serviceBookings
          ?.filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

        return {
          id: service.id,
          name: service.name,
          bookings: bookingCount,
          revenue,
          isActive: service.is_active,
        };
      })
    );

    // Recent activity
    const recentBookings = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        start_time,
        status,
        total_price,
        created_at,
        services (name),
        profiles (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentContacts = await supabase
      .from('contact_submissions')
      .select('id, name, email, phone, subject, message, status, submitted_at')
      .order('submitted_at', { ascending: false })
      .limit(5);

    // Booking status distribution
    const statusDistribution = [
      { status: 'pending', count: stats.pendingBookings, percentage: stats.totalBookings > 0 ? (stats.pendingBookings / stats.totalBookings) * 100 : 0 },
      { status: 'confirmed', count: stats.confirmedBookings, percentage: stats.totalBookings > 0 ? (stats.confirmedBookings / stats.totalBookings) * 100 : 0 },
      { status: 'completed', count: stats.completedBookings, percentage: stats.totalBookings > 0 ? (stats.completedBookings / stats.totalBookings) * 100 : 0 },
      { status: 'cancelled', count: stats.cancelledBookings, percentage: stats.totalBookings > 0 ? (stats.cancelledBookings / stats.totalBookings) * 100 : 0 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        stats,
        charts: {
          dailyRevenue,
          statusDistribution,
          servicePerformance: servicePerformance.sort((a, b) => b.revenue - a.revenue),
        },
        recent: {
          bookings: recentBookings.data || [],
          contacts: recentContacts.data || [],
        },
        period: parseInt(period),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    });

    const duration = Date.now() - startTime;
    logger.performance('admin-dashboard', duration, { 
      period: parseInt(period),
      totalBookings: stats.totalBookings,
      totalRevenue: stats.totalRevenue 
    });

  } catch (error) {
    logger.error('Dashboard API Error', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data' 
    }, { status: 500 });
  }
}