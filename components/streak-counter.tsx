'use client';

import { useEffect, useState } from 'react';

interface StreakData {
  sessionsThisMonth: number;
  weekStreak: number;
  lastSessionDate: string | null;
}

export function StreakCounter() {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    fetch('/api/sessions/streak')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data || data.sessionsThisMonth === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3">
      {/* Streak Badge */}
      {data.weekStreak > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
          <span className="text-base">🔥</span>
          <span className="text-sm font-semibold text-amber-400">
            {data.weekStreak} week{data.weekStreak !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Sessions This Month */}
      <div className="flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1.5">
        <span className="text-sm font-semibold text-teal-400">
          {data.sessionsThisMonth} session{data.sessionsThisMonth !== 1 ? 's' : ''}
        </span>
        <span className="text-xs text-teal-400/60">this month</span>
      </div>
    </div>
  );
}
