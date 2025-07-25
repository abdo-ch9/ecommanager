import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('Simple Shopify test API called');
    const { shopDomain, apiKey, password, userId } = await request.json();
    
    console.log('Received data:', { shopDomain, apiKey: apiKey ? 'provided' : 'missing', password: password ? 'provided' : 'missing', userId });

    if (!shopDomain || !apiKey || !password || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!shopDomain.endsWith('.myshopify.com')) {
      return NextResponse.json(
        { error: 'Invalid shop domain format. Must end with .myshopify.com' },
        { status: 400 }
      );
    }

    // For testing, just return success without actually calling Shopify
    console.log('Validation passed, returning success');
    
    return NextResponse.json({
      success: true,
      shop_info: {
        name: 'Test Store',
        domain: shopDomain,
        email: 'test@example.com'
      },
      permissions: {
        shop: true,
        orders: true,
        products: true,
        customers: true
      },
      message: 'Successfully connected to Shopify store (test mode)'
    });

  } catch (error) {
    console.error('Simple Shopify test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Shopify connection', details: error.message },
      { status: 500 }
    );
  }
}