import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const shop = request.headers.get('x-shopify-shop-domain');
    
    // Verify webhook authenticity
    if (!verifyWebhook(body, hmac)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderData = JSON.parse(body);
    
    // Find the integration for this shop
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', 'shopify')
      .eq('credentials->shop_domain', shop)
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found for shop:', shop);
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Store order data for email context
    const { error: orderError } = await supabase
      .from('shopify_orders')
      .insert({
        user_id: integration.user_id,
        shop_domain: shop,
        order_id: orderData.id,
        order_number: orderData.order_number,
        customer_email: orderData.email,
        customer_name: `${orderData.billing_address?.first_name || ''} ${orderData.billing_address?.last_name || ''}`.trim(),
        total_price: orderData.total_price,
        currency: orderData.currency,
        order_data: orderData,
        created_at: new Date().toISOString()
      });

    if (orderError) {
      console.error('Error storing order:', orderError);
    }

    // Create email activity record for potential customer follow-up
    const { error: activityError } = await supabase
      .from('email_activity')
      .insert({
        user_id: integration.user_id,
        customer_email: orderData.email,
        customer_name: `${orderData.billing_address?.first_name || ''} ${orderData.billing_address?.last_name || ''}`.trim(),
        subject: `Order Confirmation - #${orderData.order_number}`,
        intent: 'order_confirmation',
        context: {
          platform: 'shopify',
          order_id: orderData.id,
          order_number: orderData.order_number,
          total_price: orderData.total_price,
          currency: orderData.currency,
          shop_domain: shop
        },
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (activityError) {
      console.error('Error creating email activity:', activityError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifyWebhook(body, hmac) {
  if (!hmac || !process.env.SHOPIFY_WEBHOOK_SECRET) {
    return false;
  }

  const calculatedHmac = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'base64'),
    Buffer.from(calculatedHmac, 'base64')
  );
}