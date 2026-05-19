import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SessionList } from '@/components/session-history/session-list';

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: sessions } = await supabase
    .from('therapy_sessions')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(50);

  return (
    <div
      className="min-h-screen px-4 py-8 pt-20"
      style={{
        background:
          'linear-gradient(180deg, #0B1A2B 0%, #0F2537 50%, #0B1A2B 100%)',
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Session History
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Review your past therapy conversations
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
          >
            New Session
          </a>
        </div>

        <SessionList sessions={sessions ?? []} />
      </div>
    </div>
  );
}
