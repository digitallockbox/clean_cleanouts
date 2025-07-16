import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== TEST BOOKING API ===');
    console.log('Received data:', JSON.stringify(body, null, 2));
    
    // Simulate a successful booking creation
    const mockBooking = {
      id: 'test-booking-id',
      ...body,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    console.log('=== RETURNING MOCK BOOKING ===');
    console.log('Mock booking:', JSON.stringify(mockBooking, null, 2));
    
    return NextResponse.json({
      success: true,
      data: mockBooking,
      message: 'Test booking created successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('=== TEST API ERROR ===');
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Test API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}