import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// Shopify OAuth configuration
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/shopify/callback';

export async function POST(request) {
  try {
    const { shopDomain, userId } = await request.json();

    if (!shopDomain || !userId) {
      return NextResponse.json(
        { error: 'Shop domain and user ID are required' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    const shopName = shopDomain.replace('.myshopify.com', '');
    if (!shopName || shopName.includes('.')) {
      return NextResponse.json(
        { error: 'Invalid shop domain format' },
        { status: 400 }
      );
    }

    // Generate state parameter for security
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store state in database for verification
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        user_id: userId,
        platform: 'shopify',
        shop_domain: `${shopName}.myshopify.com`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      return NextResponse.json(
        { error: 'Failed to initiate OAuth flow' },
        { status: 500 }
      );
    }

    // Shopify OAuth scopes
    const scopes = [
      'read_orders',
      'read_products',
      'read_customers',
      'read_inventory',
      'write_orders',
      'write_products',
      'write_customers'
    ].join(',');

    // Build Shopify OAuth URL
    const authUrl = new URL(`https://${shopName}.myshopify.com/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', SHOPIFY_REDIRECT_URI);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('grant_options[]', 'per-user');

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    });

  } catch (error) {
    console.error('Shopify auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}