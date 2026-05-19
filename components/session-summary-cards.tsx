'use client';

import { useEffect, useState } from 'react';

interface CbtData {
  mood_ratings?: Array<{ type: string; intensity: number }>;
  insights?: Array<{ distortion: string }>;
  homework?: string | null;
}

interface SessionSummary {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  cbt_data: CbtData | null;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function SessionSummaryCards() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    fetch('/api/sessions?limit=3')
      .then((res) => res.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  if (sessions === null) return null;
  if (sessions.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-300">
        Recent Sessions
      </h3>
      <div className="space-y-2">
        {sessions.map((session) => {
          const moods = session.cbt_data?.mood_ratings;
          const startMood = moods && moods.length > 0 ? moods[0] : null;
          const endMood = moods && moods.length >= 2 ? moods[moods.length - 1] : null;
          const distortions = session.cbt_data?.insights?.map((i) => i.distortion) ?? [];
          const topDistortion = distortions[0];
          const homework = session.cbt_data?.homework;

          return (
            <a
              key={session.id}
              href={`/history/${session.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3 transition-colors hover:border-slate-600 hover:bg-slate-800"
            >
              {/* Date + Duration */}
              <div className="shrink-0">
                <p className="text-sm font-medium text-white">
                  {formatDate(session.started_at)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDuration(session.duration_seconds)}
                </p>
              </div>

              {/* Divider */}
              <div className="h-8 w-px shrink-0 bg-slate-700" />

              {/* CBT Summary */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {/* Mood Change */}
                {startMood && endMood && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-[11px]">
                    <span className="text-red-400">{startMood.intensity}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400">{endMood.intensity}</span>
                  </span>
                )}

                {/* Top Distortion */}
                {topDistortion && (
                  <span className="truncate rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
                    {topDistortion}
                  </span>
                )}

                {/* Homework */}
                {homework && (
                  <span className="truncate rounded-full bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-400">
                    📋 Homework
                  </span>
                )}

                {/* No CBT data */}
                {!startMood && !topDistortion && !homework && (
                  <span className="text-xs text-slate-500">
                    No CBT data recorded
                  </span>
                )}
              </div>

              {/* Arrow */}
              <span className="shrink-0 text-slate-600">›</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
