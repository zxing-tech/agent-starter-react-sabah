'use client';

interface CbtData {
  mood_ratings?: Array<{ type: string; intensity: number }>;
  insights?: Array<{ distortion: string }>;
  homework?: string | null;
}

interface TherapySession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  summary: string | null;
  cbt_data: CbtData | null;
}

interface SessionListProps {
  sessions: TherapySession[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
        <p className="text-lg font-medium text-slate-300">No sessions yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Start a conversation to see your session history here.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg px-6 py-2 text-sm font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #1A8A8A, #47C4CF)' }}
        >
          Start Session
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <a
          key={session.id}
          href={`/history/${session.id}`}
          className="block rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-colors hover:border-slate-600 hover:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                {formatDate(session.started_at)}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {formatTime(session.started_at)}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                {formatDuration(session.duration_seconds)}
              </span>
            </div>
          </div>
          {/* CBT indicators */}
          {session.cbt_data && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {session.cbt_data.mood_ratings &&
                session.cbt_data.mood_ratings.length > 0 && (
                  <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400">
                    {session.cbt_data.mood_ratings[0].type}{' '}
                    {session.cbt_data.mood_ratings[0].intensity}/10
                    {session.cbt_data.mood_ratings.length >= 2 &&
                      ` → ${session.cbt_data.mood_ratings[session.cbt_data.mood_ratings.length - 1].intensity}/10`}
                  </span>
                )}
              {session.cbt_data.insights &&
                session.cbt_data.insights.length > 0 && (
                  <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-[10px] text-amber-400">
                    {session.cbt_data.insights.length} thought{' '}
                    {session.cbt_data.insights.length === 1 ? 'record' : 'records'}
                  </span>
                )}
              {session.cbt_data.homework && (
                <span className="rounded-full bg-indigo-900/30 px-2 py-0.5 text-[10px] text-indigo-400">
                  homework
                </span>
              )}
            </div>
          )}
          {session.summary && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-400">
              {session.summary}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
