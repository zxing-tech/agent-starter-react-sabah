import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getBaseUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  return process.env.SITE_URL || `${forwardedProto}://${forwardedHost}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const baseUrl = getBaseUrl(request);

  if (!code) {
    return NextResponse.redirect(
      new URL('/verify-email?error=expired', baseUrl)
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL('/verify-email?error=expired', baseUrl)
    );
  }

  // If a `next` param is provided (e.g. /reset-password), redirect there
  if (next) {
    return NextResponse.redirect(new URL(next, baseUrl));
  }

  // Session established — check if this is an OAuth user needing consent
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const isOAuth = user.app_metadata?.provider !== 'email';
    const hasConsent = user.user_metadata?.pdpa_consent_at;

    // First-time OAuth user: needs PDPA consent
    if (isOAuth && !hasConsent) {
      return NextResponse.redirect(new URL('/sso-consent', baseUrl));
    }

    // Returning OAuth user: go straight to dashboard
    if (isOAuth) {
      return NextResponse.redirect(new URL('/', baseUrl));
    }
  }

  // Magic link or email verification — go to home
  return NextResponse.redirect(new URL('/', baseUrl));
}
