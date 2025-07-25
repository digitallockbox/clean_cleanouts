import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    logger.info('=== TEST BOOKING API ===');
    logger.info('Received data:', JSON.stringify(body, null, 2));
    
    // Simulate a successful booking creation
    const mockBooking = {
      id: 'test-booking-id',
      ...body,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    logger.info('=== RETURNING MOCK BOOKING ===');
    logger.info('Mock booking:', JSON.stringify(mockBooking, null, 2));
    
    return NextResponse.json({
      success: true,
      data: mockBooking,
      message: 'Test booking created successfully',
    }, { status: 201 });
    
  } catch (error) {
    logger.error('=== TEST API ERROR ===');
    logger.error('Error:', error);
    return NextResponse.json({ 
      error: 'Test API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}