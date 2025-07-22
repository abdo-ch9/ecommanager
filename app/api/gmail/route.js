import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { GmailService } from '@/utils/gmail';

// Helper to create Supabase client with server-side cookie access
function createSupabaseServerClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: () => cookies()
    }
  );
}


// ----------------- GET Handler -----------------

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get('action');
    const messageId = searchParams.get('messageId');
    const query = searchParams.get('query');
    const maxResults = searchParams.get('maxResults');

    const supabase = createSupabaseServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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
    console.error('Gmail GET API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ----------------- POST Handler -----------------

export async function POST(request) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const gmailService = await new GmailService(session.user.id).initialize();
    const response = await gmailService.sendMessage(to, subject, body);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Gmail POST API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
