'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';

interface ProgressData {
  totalSessions: number;
  totalTimeSeconds: number;
  avgDurationSeconds: number;
  moodTrajectory: Array<{
    date: string;
    startMood: number;
    endMood: number;
    moodType: string;
  }>;
  distortions: Array<{ name: string; count: number }>;
  homeworkRate: number;
  sessionsWithHomework: number;
  totalThoughtRecords: number;
}

const DISTORTION_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#94a3b8',
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function ProgressSummary() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/progress?range=30')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
      </div>
    );
  }

  if (!data || data.totalSessions === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
        <p className="text-base font-medium text-slate-300">
          No sessions yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Start a conversation to see your progress here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Sessions" value={data.totalSessions} sub="last 30 days" />
        <StatCard label="Total Time" value={formatDuration(data.totalTimeSeconds)} />
        <StatCard label="Avg Duration" value={formatDuration(data.avgDurationSeconds)} />
        <StatCard label="Thought Records" value={data.totalThoughtRecords} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Mood Trajectory */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Mood Trend</h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                Start
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                End
              </span>
            </div>
          </div>
          {data.moodTrajectory.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.moodTrajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#334155"
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#334155"
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="startMood"
                  stroke="#f87171"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Start"
                />
                <Line
                  type="monotone"
                  dataKey="endMood"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="End"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[160px] items-center justify-center">
              <p className="text-xs text-slate-500">
                Need 2+ sessions with mood ratings
              </p>
            </div>
          )}
        </div>

        {/* Distortions */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">
            Top Distortions
          </h3>
          {data.distortions.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={160}
            >
              <BarChart
                data={data.distortions.slice(0, 5)}
                layout="vertical"
                margin={{ left: 0, right: 8 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  stroke="#334155"
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  stroke="#334155"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Identified">
                  {data.distortions.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={DISTORTION_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[160px] items-center justify-center">
              <p className="text-xs text-slate-500">
                No distortions identified yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Homework Rate */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Homework Completion</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {data.sessionsWithHomework} of {data.totalSessions} sessions had homework assigned
            </p>
          </div>
          <span className="text-2xl font-bold text-teal-400">
            {data.homeworkRate}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${data.homeworkRate}%` }}
          />
        </div>
      </div>

      {/* Full dashboard link */}
      <div className="text-center">
        <a
          href="/progress"
          className="text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          View full dashboard &rarr;
        </a>
      </div>
    </div>
  );
}
