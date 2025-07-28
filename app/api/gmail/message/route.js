// app/api/gmail/message/route.js
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request) {
  try {
    // Check for required environment variables
    const requiredEnvVars = {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: `Missing environment variables: ${missingVars.join(', ')}`
      }, { status: 500 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    // header fallback for access+refresh
    const auth = request.headers.get('Authorization');
    const refresh = request.headers.get('x-refresh-token');
    if (auth?.startsWith('Bearer ') && refresh) {
      await supabase.auth.setSession({
        access_token: auth.split(' ')[1],
        refresh_token: refresh,
      });
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.error('Authentication error:', userErr);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    console.log('Fetching message with ID:', id);

    const { data: integration, error: intErr } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('platform', 'gmail')
      .single();
    if (intErr || !integration) {
      console.error('Integration error:', intErr);
      return NextResponse.json({ error: 'Gmail integration not found' }, { status: 404 });
    }

    const { credentials: creds } = integration;
    if (!creds || !creds.access_token) {
      console.error('Missing credentials');
      return NextResponse.json({ error: 'Missing Gmail access token' }, { status: 400 });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/integration`
    );
    oauth2.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: creds.expires_at ? new Date(creds.expires_at).getTime() : undefined,
    });

    // Add token refresh handler
    oauth2.on('tokens', async tokens => {
      console.log('Tokens refreshed');
      const updated = {
        ...creds,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || creds.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)).toISOString(),
      };
      await supabase
        .from('integrations')
        .update({ credentials: updated, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('platform', 'gmail');
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2 });
    
    console.log('Fetching message from Gmail API...');
    const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
    console.log('Message fetched successfully');

    let body = '';
    let htmlBody = '';
    const walk = parts => {
      for (const p of parts || []) {
        if (p.mimeType === 'text/html' && p.body?.data) {
          htmlBody += Buffer.from(p.body.data, 'base64').toString('utf-8');
        } else if (p.mimeType === 'text/plain' && p.body?.data) {
          body += Buffer.from(p.body.data, 'base64').toString('utf-8');
        } else if (p.parts) {
          walk(p.parts);
        }
      }
    };
    if (msg.data.payload.body?.data) {
      body += Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
    }
    walk(msg.data.payload.parts);

    const content = htmlBody || body;
    console.log('Content extracted, length:', content.length);

    return NextResponse.json({ body: content });
  } catch (error) {
    console.error('Error fetching email message:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status
    });
    return NextResponse.json({ 
      error: 'Failed to load email content',
      details: error.message 
    }, { status: 500 });
  }
}
