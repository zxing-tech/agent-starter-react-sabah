import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { SessionDetail } from '@/components/session-history/session-detail';

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  const { data: session } = await supabase
    .from('therapy_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) {
    notFound();
  }

  const { data: messages } = await supabase
    .from('session_messages')
    .select('*')
    .eq('session_id', id)
    .order('timestamp', { ascending: true });

  return (
    <div
      className="min-h-screen px-4 py-8 pt-20"
      style={{
        background:
          'linear-gradient(180deg, #0B1A2B 0%, #0F2537 50%, #0B1A2B 100%)',
      }}
    >
      <div className="mx-auto max-w-2xl">
        <SessionDetail session={session} messages={messages ?? []} />
      </div>
    </div>
  );
}
