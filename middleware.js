import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  console.log('Middleware executing for path:', req.nextUrl.pathname);
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log('Middleware session check:', session ? 'Session exists' : 'No session');

    // Refresh session if it exists
    if (session) {
      const { access_token, refresh_token } = session;
      await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    }
  } catch (e) {
    console.error('Middleware error:', e);
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
