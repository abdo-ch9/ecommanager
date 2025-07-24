import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { google } from 'googleapis';

export async function GET(request) {
  try {
    console.log('Gmail stats API called');
    const supabase = createRouteHandlerClient({ cookies });

    // Try to get access token and refresh token from custom headers
    const access_token = request.headers.get('x-access-token');
    const refresh_token = request.headers.get('x-refresh-token');
    let session = null;
    let sessionError = null;
    console.log('API: received tokens', { access_token, refresh_token });
    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      session = data?.session;
      sessionError = error;
      console.log('API: setSession result', { session, sessionError });
    } else {
      // Fallback to Authorization header (legacy)
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.setSession({ access_token: token, refresh_token: null });
        session = data?.session;
        sessionError = error;
        console.log('API: setSession result', { session, sessionError });
      } else {
        // Fallback to cookie-based session
        const result = await supabase.auth.getSession();
        session = result.data.session;
        sessionError = result.error;
        console.log('API: setSession result', { session, sessionError });
      }
    }

    console.log('Session check:', { 
      hasSession: !!session, 
      sessionError: sessionError?.message,
      userId: session?.user?.id 
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if Gmail is connected
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'gmail')
      .single();

    console.log('Integration check:', { 
      hasIntegration: !!integration, 
      integrationError: integrationError?.message,
      hasAccessToken: !!integration?.credentials?.access_token 
    });

    if (integrationError) {
      console.error('Integration error:', integrationError);
      return NextResponse.json({ error: 'Gmail integration not found' }, { status: 404 });
    }
    
    if (!integration) {
      console.log('No Gmail integration found');
      return NextResponse.json({ error: 'Gmail integration not found' }, { status: 404 });
    }

    if (!integration.credentials?.access_token) {
      console.log('No access token found in integration');
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
        console.log('Refreshing tokens...');
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
        } else {
          console.log('Tokens updated successfully');
        }
      } catch (err) {
        console.error('Token refresh error:', err);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const people = google.people({ version: 'v1', auth: oauth2Client });

    console.log('Fetching Gmail data...');

    // Get total emails count
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 1,
    });

    const totalEmails = response.data.resultSizeEstimate || 0;

    // Get labels count
    const labelsResponse = await gmail.users.labels.list({
      userId: 'me',
    });

    const totalLabels = labelsResponse.data.labels ? labelsResponse.data.labels.length : 0;

    // Get contacts count (with error handling)
    let totalContacts = 0;
    try {
      const contactsResponse = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 1000,
        personFields: 'names',
      });
      totalContacts = contactsResponse.data.totalItems || 0;
    } catch (contactsError) {
      console.warn('Could not fetch contacts:', contactsError.message);
      // Continue without contacts data
    }

    console.log('Gmail stats fetched successfully:', { totalEmails, totalLabels, totalContacts });

    return NextResponse.json({
      emails: totalEmails,
      labels: totalLabels,
      contacts: totalContacts,
    });
  } catch (error) {
    console.error('Gmail stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}