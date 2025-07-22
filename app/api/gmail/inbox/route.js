import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request) {
  try {
    console.log('Initializing Supabase client...');
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Set the session using the token
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: token, // You might want to handle refresh tokens differently
      });
    }
    
    console.log('Checking session...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }
    
    console.log('Session check result:', session ? 'Session found' : 'No session');

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Session found for user:', session.user.email);

    // Fetch Gmail integration for the user
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'gmail')
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Gmail integration not found' },
        { status: 404 }
      );
    }

    if (!integration.credentials?.access_token) {
      return NextResponse.json(
        { error: 'Missing Gmail access token' },
        { status: 400 }
      );
    }

    console.log('Gmail linked to:', integration.credentials.email);

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/integration`
    );

    oauth2Client.setCredentials({
      access_token: integration.credentials.access_token,
      refresh_token: integration.credentials.refresh_token,
      expiry_date: new Date(integration.credentials.expires_at).getTime(),
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      try {
        const updatedCredentials = {
          ...integration.credentials,
          access_token: tokens.access_token,
          refresh_token:
            tokens.refresh_token || integration.credentials.refresh_token,
          expires_at: new Date(
            Date.now() + (tokens.expiry_date || 3600 * 1000)
          ).toISOString(),
        };

        const { error: updateError } = await supabase
          .from('integrations')
          .update({
            credentials: updatedCredentials,
            updated_at: new Date().toISOString(),
          })
          .eq('id', integration.id);

        if (updateError) {
          console.error('Error updating tokens:', updateError);
        } else {
          console.log('Access token refreshed.');
        }
      } catch (err) {
        console.error('Token refresh error:', err);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch inbox messages
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 20,
    });

    if (!res.data.messages) {
      return NextResponse.json([]);
    }

    const messages = await Promise.all(
      res.data.messages.map(async (msg) => {
        try {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = details.data.payload.headers;
          return {
            id: msg.id,
            threadId: msg.threadId,
            subject:
              headers.find((h) => h.name === 'Subject')?.value || '(no subject)',
            from: headers.find((h) => h.name === 'From')?.value || '',
            date: headers.find((h) => h.name === 'Date')?.value || '',
            snippet: details.data.snippet || '',
          };
        } catch (error) {
          console.error('Error fetching message:', error);
          return null;
        }
      })
    );

    const filtered = messages.filter(Boolean);
    console.log(`Fetched ${filtered.length} messages.`);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Fatal Gmail API error:', error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.response?.data || error.stack || error,
      },
      { status: 500 }
    );
  }
}
