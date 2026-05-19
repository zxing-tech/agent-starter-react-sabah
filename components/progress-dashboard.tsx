'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export function ProgressDashboard() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/progress?range=${range}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-teal-400" />
      </div>
    );
  }

  if (!data || data.totalSessions === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-12 text-center">
        <p className="text-lg font-medium text-slate-300">No session data yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Complete a few sessions to see your progress here.
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
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex gap-2">
        {[
          { label: '7 days', value: '7' },
          { label: '30 days', value: '30' },
          { label: 'All time', value: '3650' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === opt.value
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Sessions" value={data.totalSessions} />
        <StatCard
          label="Total Time"
          value={formatDuration(data.totalTimeSeconds)}
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(data.avgDurationSeconds)}
        />
        <StatCard
          label="Thought Records"
          value={data.totalThoughtRecords}
        />
      </div>

      {/* Mood Trajectory Chart */}
      {data.moodTrajectory.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Mood Trajectory
          </h3>
          <p className="mb-3 text-xs text-slate-400">
            Start vs end of session mood (lower is better)
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.moodTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                stroke="#475569"
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                stroke="#475569"
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line
                type="monotone"
                dataKey="startMood"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f87171' }}
                name="Start"
              />
              <Line
                type="monotone"
                dataKey="endMood"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 4, fill: '#34d399' }}
                name="End"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
              Start of session
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              End of session
            </span>
          </div>
        </div>
      )}

      {/* Distortion Frequency */}
      {data.distortions.length > 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-white">
            Cognitive Distortions Identified
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(180, data.distortions.length * 36)}>
            <BarChart
              data={data.distortions}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                stroke="#475569"
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                stroke="#475569"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Times identified">
                {data.distortions.map((_, index) => (
                  <Cell
                    key={index}
                    fill={DISTORTION_COLORS[index % DISTORTION_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Homework Rate */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-white">
            Homework Assigned
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-teal-400">
              {data.homeworkRate}%
            </span>
            <span className="mb-1 text-xs text-slate-400">
              of sessions ({data.sessionsWithHomework}/{data.totalSessions})
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${data.homeworkRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-white">
            Thought Records
          </h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-purple-400">
              {data.totalThoughtRecords}
            </span>
            <span className="mb-1 text-xs text-slate-400">
              completed
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Each thought record helps you identify and reframe unhelpful thinking patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
