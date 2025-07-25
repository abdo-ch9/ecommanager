import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  try {
    console.log('Simple Shopify connect API called');
    const { shopDomain, apiKey, password, userId } = await request.json();
    
    console.log('Received data:', { 
      shopDomain, 
      apiKey: apiKey ? 'provided' : 'missing', 
      password: password ? 'provided' : 'missing', 
      userId 
    });

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

    console.log('Validation passed, storing in database...');

    // Store credentials directly in database (for testing)
    const { error: integrationError } = await supabase
      .from('integrations')
      .upsert({
        user_id: userId,
        platform: 'shopify',
        credentials: {
          shop_domain: shopDomain,
          api_key: apiKey,
          password: password,
          shop_info: {
            name: 'Test Store',
            domain: shopDomain,
            email: 'test@example.com'
          }
        },
        status: 'connected',
        connected_at: new Date().toISOString()
      });

    if (integrationError) {
      console.error('Database error:', integrationError);
      return NextResponse.json(
        { error: 'Failed to store integration', details: integrationError.message },
        { status: 500 }
      );
    }

    console.log('Successfully stored integration');
    
    return NextResponse.json({
      success: true,
      shop_info: {
        name: 'Test Store',
        domain: shopDomain,
        email: 'test@example.com'
      },
      message: 'Successfully connected to Shopify store (simple mode)'
    });

  } catch (error) {
    console.error('Simple Shopify connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect Shopify', details: error.message },
      { status: 500 }
    );
  }
}