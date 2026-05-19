import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const THIRTY_DAYS = 30 * 24 * 60 * 60;

export async function createClient() {
  const cookieStore = await cookies();
  const rememberMe = cookieStore.get('remember_me')?.value === '1';

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                // Session cookie (no maxAge) when remember-me is off,
                // 30-day persistent cookie when remember-me is on
                maxAge: rememberMe ? THIRTY_DAYS : undefined,
              });
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
