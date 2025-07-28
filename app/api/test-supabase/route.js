import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Test basic connection
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({
        status: 'error',
        message: 'Authentication error',
        error: userError.message
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({
        status: 'error',
        message: 'No authenticated user',
        user: null
      }, { status: 401 });
    }
    
    // Test database access
    const { data: integrations, error: dbError } = await supabase
      .from('integrations')
      .select('id, platform, created_at')
      .eq('user_id', user.id)
      .limit(5);
    
    if (dbError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database error',
        error: dbError.message,
        user: { id: user.id, email: user.email }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'ok',
      user: { id: user.id, email: user.email },
      integrations: integrations || [],
      integrationCount: integrations?.length || 0
    });
    
  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error.message
    }, { status: 500 });
  }
} 