import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // For now, we'll skip auth check to test the basic functionality
    // TODO: Re-enable auth check once we confirm the API works
    
    // Get current user
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Check if user is admin
    // if (!isAdmin(user)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const body = await request.json();
    const { 
      tables = [], 
      format = 'json', 
      dateRange = null,
      includeDeleted = false 
    } = body;

    if (!Array.isArray(tables) || tables.length === 0) {
      return NextResponse.json({ error: 'No tables specified for export' }, { status: 400 });
    }

    const exportData: Record<string, any> = {};
    const timestamp = new Date().toISOString();

    // Define available tables for export
    const availableTables = [
      'profiles',
      'services',
      'service_categories',
      'bookings',
      'contact_submissions',
      'service_reviews',
      'payments',
      'notifications',
      'user_preferences',
      'payment_methods',
      'website_settings'
    ];

    // Validate requested tables
    const validTables = tables.filter(table => availableTables.includes(table));
    
    if (validTables.length === 0) {
      return NextResponse.json({ error: 'No valid tables specified' }, { status: 400 });
    }

    // Export each table
    for (const tableName of validTables) {
      try {
        let query = supabase.from(tableName).select('*');

        // Apply date range filter if specified
        if (dateRange && dateRange.from && dateRange.to) {
          query = query
            .gte('created_at', dateRange.from)
            .lte('created_at', dateRange.to);
        }

        // For some tables, we might want to exclude sensitive data
        if (tableName === 'profiles') {
          query = supabase.from(tableName).select('id, full_name, phone, created_at, updated_at');
        } else if (tableName === 'payment_methods') {
          query = supabase.from(tableName).select('id, user_id, type, last_four, brand, is_default, created_at, updated_at');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          logger.error(`Error exporting ${tableName}:`, error);
          continue;
        }

        exportData[tableName] = data || [];
      } catch (error) {
        logger.error(`Error processing table ${tableName}:`, error);
        exportData[tableName] = [];
      }
    }

    // Prepare export metadata
    const metadata = {
      exportedAt: timestamp,
      exportedBy: 'admin', // user.email,
      tables: validTables,
      format,
      totalRecords: Object.values(exportData).reduce((sum, records) => sum + (records as any[]).length, 0),
      dateRange
    };

    const response = {
      metadata,
      data: exportData
    };

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    headers.set('Content-Disposition', `attachment; filename="data-export-${timestamp.split('T')[0]}.${format}"`);

    if (format === 'csv') {
      // Convert to CSV format (simplified - you might want to use a proper CSV library)
      let csvContent = '';
      
      for (const [tableName, records] of Object.entries(exportData)) {
        if ((records as any[]).length > 0) {
          csvContent += `\n\n=== ${tableName.toUpperCase()} ===\n`;
          const headers = Object.keys((records as any[])[0]);
          csvContent += headers.join(',') + '\n';
          
          for (const record of records as any[]) {
            const values = headers.map(header => {
              const value = record[header];
              return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            });
            csvContent += values.join(',') + '\n';
          }
        }
      }
      
      return new NextResponse(csvContent, { headers });
    }

    return NextResponse.json(response, { headers });

  } catch (error) {
    logger.error('Error in data export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}