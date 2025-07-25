import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request) {
  try {
    const { shopDomain, apiKey, password, userId } = await request.json();

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

    // Test connection to Shopify using Private App credentials
    const shopifyUrl = `https://${shopDomain}/admin/api/2023-10/shop.json`;
    
    // Create Basic Auth header
    const credentials = Buffer.from(`${apiKey}:${password}`).toString('base64');
    
    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'E-commerce Manager App'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API credentials. Please check your API key and password.' },
          { status: 401 }
        );
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'Store not found. Please check your shop domain.' },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          { error: `Shopify API error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    const shopData = await response.json();
    
    // Test additional endpoints to verify permissions
    const ordersUrl = `https://${shopDomain}/admin/api/2023-10/orders.json?limit=1`;
    const ordersResponse = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const productsUrl = `https://${shopDomain}/admin/api/2023-10/products.json?limit=1`;
    const productsResponse = await fetch(productsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    const customersUrl = `https://${shopDomain}/admin/api/2023-10/customers.json?limit=1`;
    const customersResponse = await fetch(customersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    // Check permissions
    const permissions = {
      shop: true, // We already verified this works
      orders: ordersResponse.ok,
      products: productsResponse.ok,
      customers: customersResponse.ok
    };

    return NextResponse.json({
      success: true,
      shop_info: shopData.shop,
      permissions,
      message: 'Successfully connected to Shopify store'
    });

  } catch (error) {
    console.error('Shopify connection test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Shopify connection' },
      { status: 500 }
    );
  }
}