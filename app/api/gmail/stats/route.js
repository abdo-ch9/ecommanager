import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request) {
  try {
    // Debug: log the service role key (should NOT be undefined)
    console.log('SERVICE ROLE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const access_token = authHeader.split(' ')[1];

    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Set this in your .env.local (never expose to client)
      {
        global: {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      }
    );

    // Check if Gmail is connected
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('platform', 'gmail')
      .limit(1);

    if (integrationError) {
      return NextResponse.json({ error: integrationError.message }, { status: 500 });
    }
    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ error: 'Gmail integration not found' }, { status: 404 });
    }
    const integration = integrations[0];

    if (!integration.credentials?.access_token) {
      return NextResponse.json({ error: 'Gmail access token not found' }, { status: 400 });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/integration`
    );

    oauth2Client.setCredentials({
      access_token: integration.credentials.access_token,
      refresh_token: integration.credentials.refresh_token,
      expiry_date: integration.credentials.expires_at ? new Date(integration.credentials.expires_at).getTime() : undefined,
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      try {
        const updatedCredentials = {
          ...integration.credentials,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.credentials.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)).toISOString(),
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
        }
      } catch (err) {
        console.error('Token refresh error:', err);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const people = google.people({ version: 'v1', auth: oauth2Client });

    // Get labels count

    let totalEmails = 0;
    let nextPageToken = null;

    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:inbox category:primary is:unread',
        pageToken: nextPageToken,
        maxResults: 500, // maximum allowed by API
      });

      const messages = response.data.messages || [];
      totalEmails += messages.length;
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    let totalImportantEmails = 0;
    nextPageToken = null;
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:important',
        pageToken: nextPageToken,
        maxResults: 500,
      });
      const messages = response.data.messages || [];
      totalImportantEmails += messages.length;
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);



    // Get contacts count (with error handling)
    let totalSentEmails = 0;
    nextPageToken = null;
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:sent',
        pageToken: nextPageToken,
        maxResults: 500,
      });
      const messages = response.data.messages || [];
      totalSentEmails += messages.length;
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);


    return NextResponse.json({
      emails: totalEmails,
      importantEmails: totalImportantEmails,
      sentEmails: totalSentEmails,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
} 