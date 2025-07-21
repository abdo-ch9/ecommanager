import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request) {
  try {
    // Get current user session using server-side auth
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw sessionError;
    }
    
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Session found for user:', session.user.email);

    // Get Gmail integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'gmail')
      .single();

    if (integrationError) {
      console.error('Error fetching Gmail integration:', integrationError);
      return NextResponse.json({ error: 'Gmail integration not found' }, { status: 404 });
    }

    if (!integration?.credentials?.access_token) {
      console.error('No access token found in integration');
      return NextResponse.json({ error: 'Gmail not properly connected' }, { status: 400 });
    }

    console.log('Found Gmail integration for:', integration.credentials.email);

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/integration`
    );

    oauth2Client.setCredentials({
      access_token: integration.credentials.access_token,
      refresh_token: integration.credentials.refresh_token,
      expiry_date: new Date(integration.credentials.expires_at).getTime()
    });

    // Set up token refresh handler
    oauth2Client.on('tokens', async (tokens) => {
      console.log('Tokens refreshed:', tokens);
      
      const updatedCredentials = {
        ...integration.credentials,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || integration.credentials.refresh_token,
        expires_at: new Date(Date.now() + (tokens.expiry_date || 3600 * 1000)).toISOString()
      };

      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          credentials: updatedCredentials,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('Error updating tokens:', updateError);
      }
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      // Get emails from inbox
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        q: 'in:inbox'
      });

      if (!response.data.messages) {
        console.log('No messages found in inbox');
        return NextResponse.json([]);
      }

      console.log(`Found ${response.data.messages.length} messages`);

      const messages = await Promise.all(
        response.data.messages.map(async (message) => {
          try {
            const details = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date']
            });

            const headers = details.data.payload.headers;
            return {
              id: message.id,
              threadId: message.threadId,
              subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
              from: headers.find(h => h.name === 'From')?.value || '',
              date: headers.find(h => h.name === 'Date')?.value || '',
              snippet: details.data.snippet || ''
            };
          } catch (error) {
            console.error('Error fetching message details:', error);
            return null;
          }
        })
      );

      const validMessages = messages.filter(msg => msg !== null);
      console.log('Successfully processed messages:', validMessages.length);
      return NextResponse.json(validMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.code === 401) {
        return NextResponse.json({ error: 'Gmail access token expired' }, { status: 401 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error.response?.data || error
    }, { status: 500 });
  }
} 