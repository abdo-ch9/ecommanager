import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get Shopify integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'shopify')
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Shopify integration not found' }, { status: 404 });
    }

    const { api_key, password, shop_domain } = integration.credentials;

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${api_key}:${password}`).toString('base64');

    // Fetch data from Shopify API using Private App credentials
    const [ordersData, productsData, customersData] = await Promise.all([
      fetchShopifyData(`https://${shop_domain}/admin/api/2023-10/orders.json?limit=50`, credentials),
      fetchShopifyData(`https://${shop_domain}/admin/api/2023-10/products.json?limit=50`, credentials),
      fetchShopifyData(`https://${shop_domain}/admin/api/2023-10/customers.json?limit=50`, credentials)
    ]);

    // Calculate statistics
    const stats = {
      orders: {
        total: ordersData?.orders?.length || 0,
        totalValue: ordersData?.orders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0,
        recent: ordersData?.orders?.slice(0, 5) || []
      },
      products: {
        total: productsData?.products?.length || 0,
        published: productsData?.products?.filter(p => p.status === 'active')?.length || 0,
        recent: productsData?.products?.slice(0, 5) || []
      },
      customers: {
        total: customersData?.customers?.length || 0,
        recent: customersData?.customers?.slice(0, 5) || []
      }
    };

    return NextResponse.json({
      success: true,
      shop_info: integration.credentials.shop_info,
      stats
    });

  } catch (error) {
    console.error('Shopify data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch Shopify data' }, { status: 500 });
  }
}

async function fetchShopifyData(url, credentials) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Shopify API error:', error);
    return null;
  }
}