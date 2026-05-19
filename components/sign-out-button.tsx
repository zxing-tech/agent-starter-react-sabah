'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
    >
      Sign out
    </button>
  );
}
