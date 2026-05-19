import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rememberMe = request.cookies.get('remember_me')?.value === '1';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: rememberMe ? THIRTY_DAYS : undefined,
            });
          });
        },
      },
    }
  );

  // getUser() triggers automatic token refresh via @supabase/ssr
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/verify-email') ||
    request.nextUrl.pathname.startsWith('/forgot-password') ||
    request.nextUrl.pathname.startsWith('/privacy') ||
    request.nextUrl.pathname.startsWith('/terms');

  // If not authenticated and not on auth pages, redirect to login
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';

    // Only show SESSION_EXPIRED if the user previously had an auth cookie
    // (i.e., they were logged in and their session expired, not a fresh visit)
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    if (error && hasAuthCookie) {
      url.searchParams.set('message', 'SESSION_EXPIRED');
    }

    return NextResponse.redirect(url);
  }

  // If authenticated and on auth pages, redirect to home (except legal pages)
  if (user && isAuthPage) {
    const isLegalPage =
      request.nextUrl.pathname.startsWith('/privacy') ||
      request.nextUrl.pathname.startsWith('/terms');
    if (!isLegalPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
