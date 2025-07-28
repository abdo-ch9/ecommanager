// /app/api/gmail/inbox/route.js
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

    // Build Gmail search query based on type and get pagination parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'inbox';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50; // Default 50 emails per page
    
    let query = 'in:inbox';
    if (type === 'unread') query = 'in:inbox category:primary is:unread';
    else if (type === 'important') query = 'is:important';
    else if (type === 'sent') query = 'in:sent';
    
    // Smart pagination: fetch only what we need
    let allMessages = [];
    let pageToken = null;
    let currentPage = 1;
    let totalCount = 0;
    
    // First, get a sample to estimate total count
    const sampleRes = await gmail.users.messages.list({ 
      userId: 'me', 
      q: query, 
      maxResults: 100
    });
    
    if (sampleRes.data.messages) {
      allMessages.push(...sampleRes.data.messages);
      pageToken = sampleRes.data.nextPageToken;
    }
    
    // If we need more emails for the requested page, fetch them
    const emailsNeeded = page * limit;
    while (pageToken && allMessages.length < emailsNeeded && allMessages.length < 1000) {
      const listRes = await gmail.users.messages.list({ 
        userId: 'me', 
        q: query, 
        maxResults: 100,
        pageToken: pageToken 
      });
      
      if (listRes.data.messages) {
        allMessages.push(...listRes.data.messages);
      }
      
      pageToken = listRes.data.nextPageToken;
      currentPage++;
    }
    
    // Estimate total count based on what we've fetched
    totalCount = allMessages.length >= emailsNeeded ? allMessages.length + 50 : allMessages.length;
    
    // Apply pagination to the results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const msgs = allMessages.slice(startIndex, endIndex);

    // Fetch metadata for each message
    // Optimization: fetch message metadata in batch using messages.get with format 'metadata' for all messages in parallel
    // But Gmail API does not support batch get in this way, so we will cache results in memory for this example to reduce calls

    // Simple in-memory cache for message metadata during this request
    const metadataCache = new Map();

    const messages = await Promise.all(
      msgs.map(async msg => {
        if (metadataCache.has(msg.id)) {
          return metadataCache.get(msg.id);
        }
        try {
          const detailRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });
          const headers = detailRes.data.payload.headers;
          const messageData = {
            id: msg.id,
            threadId: msg.threadId,
            subject: headers.find(h => h.name === 'Subject')?.value || '(no subject)',
            from: headers.find(h => h.name === 'From')?.value || '',
            date: headers.find(h => h.name === 'Date')?.value || '',
            snippet: detailRes.data.snippet || '',
          };
          metadataCache.set(msg.id, messageData);
          return messageData;
        } catch (err) {
          console.error('Error fetching message details', err);
          return null;
        }
      })
    );

    return NextResponse.json({
      messages: messages.filter(Boolean),
      total: totalCount,
      page,
      limit,
      hasMore: pageToken !== null
    });
  } catch (error) {
    console.error('Fatal Gmail API error:', error);
    return NextResponse.json({ error: error.message, details: error.stack }, { status: 500 });
  }
}