'use client';

import { useEffect, useState } from 'react';

interface HomeworkData {
  homework: string;
  sessionDate: string;
  sessionId: string;
}

export function HomeworkBanner() {
  const [data, setData] = useState<HomeworkData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/sessions/homework')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((d) => {
        if (d?.homework) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data || dismissed) return null;

  const daysAgo = Math.floor(
    (Date.now() - new Date(data.sessionDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="mb-6 rounded-xl border border-teal-500/30 bg-teal-950/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-lg">
            📋
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-300">
              Homework from your last session
              {daysAgo > 0 && (
                <span className="ml-1 font-normal text-teal-400/60">
                  ({daysAgo} day{daysAgo !== 1 ? 's' : ''} ago)
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-slate-300">{data.homework}</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg bg-teal-500/20 px-3 py-1.5 text-xs font-medium text-teal-300 transition-colors hover:bg-teal-500/30"
        >
          Done
        </button>
      </div>
    </div>
  );
}
