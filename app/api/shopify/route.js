import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { apiKey, storeUrl } = await request.json();

    if (!apiKey || !storeUrl) {
      return NextResponse.json({ error: 'API key and store URL are required' }, { status: 400 });
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Store Shopify integration credentials
    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        user_id: session.user.id,
        platform: 'shopify',
        credentials: {
          api_key: apiKey,
          store_url: storeUrl,
        },
        status: 'connected',
        connected_at: new Date().toISOString(),
      });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Shopify connected successfully' });
  } catch (error) {
    console.error('Shopify integration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Delete Shopify integration for the user
    const { error: deleteError } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', session.user.id)
      .eq('platform', 'shopify');

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Shopify disconnected successfully' });
  } catch (error) {
    console.error('Shopify integration delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
