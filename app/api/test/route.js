import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('Test API endpoint called');
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      receivedData: body
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Test API failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test GET endpoint working'
  });
}