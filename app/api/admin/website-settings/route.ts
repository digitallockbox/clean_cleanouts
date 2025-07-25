import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, logAdminAction } from '@/lib/auth-utils';
import { logger } from '@/lib/logger';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user!;
    logger.info('Admin accessing website settings', { userId: user.id });

    // Get all website settings
    const { data: settings, error } = await supabase
      .from('website_settings')
      .select('*')
      .order('key');

    if (error) {
      logger.error('Error fetching website settings', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Transform settings into a more usable format
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        value: setting.value,
        type: setting.type,
        updated_at: setting.updated_at
      };
      return acc;
    }, {} as Record<string, any>);

    const duration = Date.now() - startTime;
    logger.performance('website-settings-get', duration, { settingsCount: settings.length });

    return NextResponse.json({ 
      success: true, 
      data: settingsMap 
    });

  } catch (error) {
    logger.error('Error in website settings GET', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user!;
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings data' }, { status: 400 });
    }

    logger.info('Admin updating website settings', { 
      userId: user.id, 
      settingsCount: Object.keys(settings).length 
    });

    // Get current settings for audit log
    const { data: currentSettings } = await supabase
      .from('website_settings')
      .select('*');

    const currentSettingsMap = currentSettings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>) || {};

    // Update settings one by one
    const updatePromises = Object.entries(settings).map(async ([key, settingData]: [string, any]) => {
      const { value, type } = settingData;
      
      return supabase
        .from('website_settings')
        .upsert({
          key,
          value: String(value),
          type: type || 'text'
        }, {
          onConflict: 'key'
        });
    });

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      logger.error('Error updating website settings', errors);
      return NextResponse.json({ error: 'Failed to update some settings' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(
      user,
      'update_website_settings',
      'website_settings',
      'bulk_update',
      currentSettingsMap,
      settings
    );

    const duration = Date.now() - startTime;
    logger.performance('website-settings-update', duration, { settingsCount: Object.keys(settings).length });

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    });

  } catch (error) {
    logger.error('Error in website settings PUT', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const user = authResult.user!;
    const body = await request.json();
    const { key, value, type = 'text' } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    logger.info('Admin creating website setting', { 
      userId: user.id, 
      key, 
      type 
    });

    // Insert new setting
    const { data, error } = await supabase
      .from('website_settings')
      .insert({
        key,
        value: String(value),
        type
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating website setting', error);
      return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 });
    }

    // Log admin action
    await logAdminAction(
      user,
      'create_website_setting',
      'website_settings',
      key,
      null,
      { key, value, type }
    );

    const duration = Date.now() - startTime;
    logger.performance('website-settings-create', duration, { key });

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Setting created successfully' 
    });

  } catch (error) {
    logger.error('Error in website settings POST', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}