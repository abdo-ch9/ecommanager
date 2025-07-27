// /app/api/gmail/inbox/route.js
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request) {
  try {
    // Initialize Supabase client with request cookies
    const supabase = createRouteHandlerClient({ cookies });

    // Fallback: accept access & refresh tokens via headers if no cookie session
    const authHeader = request.headers.get('Authorization');
    const refreshHeader = request.headers.get('x-refresh-token');
    if (authHeader && authHeader.startsWith('Bearer ') && refreshHeader) {
      const access_token = authHeader.split(' ')[1];
      await supabase.auth.setSession({ access_token, refresh_token: refreshHeader });
    }

    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch Gmail integration record
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'gmail')
      .single();
    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Gmail integration not found' }, { status: 404 });
    }

    // Ensure access token exists
    const creds = integration.credentials;
    if (!creds || !creds.access_token) {
      return NextResponse.json({ error: 'Missing Gmail access token' }, { status: 400 });
    }

    // Configure Google OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/integration`
    );
    oauth2Client.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: new Date(creds.expires_at).getTime(),
    });

    // Persist refreshed tokens
    oauth2Client.on('tokens', async tokens => {
      const updated = {
        ...creds,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || creds.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)).toISOString(),
      };
      await supabase
        .from('integrations')
        .update({ credentials: updated, updated_at: new Date().toISOString() })
        .eq('id', integration.id);
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build Gmail search query based on type
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inbox';
    let query = 'in:inbox';
    if (type === 'unread') query = 'in:inbox category:primary is:unread';
    else if (type === 'important') query = 'is:important';
    else if (type === 'sent') query = 'in:sent';

    // List messages
    const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 20 });
    const msgs = listRes.data.messages || [];

    // Fetch metadata for each message
    const messages = await Promise.all(
      msgs.map(async msg => {
        try {
          const detailRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });
          const headers = detailRes.data.payload.headers;
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
            from: headers.find(h => h.name === 'From')?.value || '',
            date: headers.find(h => h.name === 'Date')?.value || '',
            snippet: detailRes.data.snippet || '',
          };
        } catch (err) {
          console.error('Error fetching message details', err);
          return null;
        }
      })
    );

    return NextResponse.json(messages.filter(Boolean));
  } catch (error) {
    console.error('Fatal Gmail API error:', error);
    return NextResponse.json({ error: error.message, details: error.stack }, { status: 500 });
  }
}