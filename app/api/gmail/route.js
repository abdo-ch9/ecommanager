import { NextResponse } from 'next/server';
import { GmailService } from '@/utils/gmail';
import { supabase } from '@/utils/supabase';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const messageId = searchParams.get('messageId');
    const query = searchParams.get('query');
    const maxResults = searchParams.get('maxResults');

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Initialize Gmail service
    const gmailService = await new GmailService(session.user.id).initialize();

    let response;
    switch (action) {
      case 'list':
        response = await gmailService.listMessages(query, maxResults ? parseInt(maxResults) : 10);
        break;
      case 'get':
        if (!messageId) {
          return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
        }
        response = await gmailService.getMessage(messageId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Initialize Gmail service
    const gmailService = await new GmailService(session.user.id).initialize();

    // Send email
    const response = await gmailService.sendMessage(to, subject, body);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 