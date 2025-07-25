import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop');
    const hmac = searchParams.get('hmac');

    if (!code || !state || !shop) {
      return NextResponse.redirect(
        new URL('/integration?error=missing_parameters', request.url)
      );
    }

    // Verify state parameter
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'shopify')
      .single();

    if (stateError || !stateData) {
      console.error('Invalid state parameter:', stateError);
      return NextResponse.redirect(
        new URL('/integration?error=invalid_state', request.url)
      );
    }

    // Check if state has expired
    if (new Date() > new Date(stateData.expires_at)) {
      return NextResponse.redirect(
        new URL('/integration?error=state_expired', request.url)
      );
    }

    // Verify shop domain matches
    if (shop !== stateData.shop_domain) {
      return NextResponse.redirect(
        new URL('/integration?error=shop_mismatch', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/integration?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, scope } = tokenData;

    // Get shop information
    const shopInfoResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
      },
    });

    let shopInfo = {};
    if (shopInfoResponse.ok) {
      const shopData = await shopInfoResponse.json();
      shopInfo = shopData.shop;
    }

    // Store integration in database
    const integrationData = {
      user_id: stateData.user_id,
      platform: 'shopify',
      credentials: {
        access_token,
        shop_domain: shop,
        scope: scope.split(','),
        shop_info: shopInfo,
      },
      status: 'connected',
      connected_at: new Date().toISOString(),
    };

    // Delete existing Shopify integrations for this user
    await supabase
      .from('integrations')
      .delete()
      .eq('user_id', stateData.user_id)
      .eq('platform', 'shopify');

    // Insert new integration
    const { error: integrationError } = await supabase
      .from('integrations')
      .insert(integrationData);

    if (integrationError) {
      console.error('Error storing integration:', integrationError);
      return NextResponse.redirect(
        new URL('/integration?error=storage_failed', request.url)
      );
    }

    // Clean up OAuth state
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Set up webhooks for real-time updates
    try {
      await setupShopifyWebhooks(shop, access_token, stateData.user_id);
    } catch (webhookError) {
      console.error('Webhook setup failed:', webhookError);
      // Don't fail the integration for webhook errors
    }

    // Redirect back to integration page with success
    return NextResponse.redirect(
      new URL('/integration?success=shopify_connected', request.url)
    );

  } catch (error) {
    console.error('Shopify callback error:', error);
    return NextResponse.redirect(
      new URL('/integration?error=callback_failed', request.url)
    );
  }
}

async function setupShopifyWebhooks(shop, accessToken, userId) {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/shopify/webhooks`;
  
  const webhooks = [
    {
      topic: 'orders/create',
      address: `${webhookUrl}/orders/create`,
      format: 'json'
    },
    {
      topic: 'orders/updated',
      address: `${webhookUrl}/orders/updated`,
      format: 'json'
    },
    {
      topic: 'customers/create',
      address: `${webhookUrl}/customers/create`,
      format: 'json'
    }
  ];

  for (const webhook of webhooks) {
    try {
      const response = await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            ...webhook,
            fields: ['id', 'email', 'name', 'total_price', 'created_at', 'updated_at']
          }
        }),
      });

      if (response.ok) {
        const webhookData = await response.json();
        console.log(`Webhook created for ${webhook.topic}:`, webhookData.webhook.id);
      } else {
        console.error(`Failed to create webhook for ${webhook.topic}:`, await response.text());
      }
    } catch (error) {
      console.error(`Error creating webhook for ${webhook.topic}:`, error);
    }
  }
}