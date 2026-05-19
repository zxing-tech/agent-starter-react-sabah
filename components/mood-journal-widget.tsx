'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';

const MOODS = [
  { type: 'happy', emoji: '😊', color: '#34d399' },
  { type: 'calm', emoji: '😌', color: '#22d3ee' },
  { type: 'sad', emoji: '😢', color: '#818cf8' },
  { type: 'anxious', emoji: '😰', color: '#fbbf24' },
  { type: 'angry', emoji: '😤', color: '#f87171' },
  { type: 'stressed', emoji: '😫', color: '#fb923c' },
];

interface MoodEntry {
  id: string;
  mood_type: string;
  intensity: number;
  created_at: string;
}

interface ChartEntry {
  day: string;
  intensity: number;
  mood_type: string;
  color: string;
}

export function MoodJournalWidget() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    fetch('/api/mood-journal?days=7')
      .then((res) => res.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!selectedMood) return;
    setSaving(true);
    try {
      const res = await fetch('/api/mood-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moodType: selectedMood, intensity }),
      });
      if (res.ok) {
        const saved = await res.json();
        setEntries((prev) => [
          ...prev,
          {
            id: saved.id,
            mood_type: selectedMood,
            intensity,
            created_at: saved.created_at,
          },
        ]);
        setSelectedMood(null);
        setIntensity(5);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // Build 7-day chart data
  const chartData: ChartEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toISOString().split('T')[0];

    // Find latest entry for this day
    const dayEntries = entries.filter(
      (e) => new Date(e.created_at).toISOString().split('T')[0] === dateStr
    );
    const latest = dayEntries[dayEntries.length - 1];

    if (latest) {
      const mood = MOODS.find((m) => m.type === latest.mood_type);
      chartData.push({
        day: dayStr,
        intensity: latest.intensity,
        mood_type: latest.mood_type,
        color: mood?.color ?? '#64748b',
      });
    } else {
      chartData.push({
        day: dayStr,
        intensity: 0,
        mood_type: '',
        color: '#1e293b',
      });
    }
  }

  // Check if already logged today
  const today = new Date().toISOString().split('T')[0];
  const loggedToday = entries.some(
    (e) => new Date(e.created_at).toISOString().split('T')[0] === today
  );

  return (
    <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        How are you feeling?
      </h3>

      {/* Mood Selector */}
      {!loggedToday && !justSaved ? (
        <div>
          <div className="mb-3 flex justify-center gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.type}
                onClick={() => setSelectedMood(mood.type)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-center transition-all ${
                  selectedMood === mood.type
                    ? 'bg-slate-700 ring-1 ring-slate-500 scale-110'
                    : 'hover:bg-slate-700/50'
                }`}
              >
                <span className="text-xl">{mood.emoji}</span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {mood.type}
                </span>
              </button>
            ))}
          </div>

          {/* Intensity Slider */}
          {selectedMood && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Mild</span>
                <span className="font-semibold text-white">{intensity}/10</span>
                <span>Intense</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-teal-500"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-2 w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Log Mood'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mb-3 text-xs text-teal-400">
          {justSaved ? '✓ Mood logged!' : '✓ Mood logged today'}
        </p>
      )}

      {/* 7-Day Chart */}
      {entries.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-slate-400">Last 7 days</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#64748b' }}
                stroke="#334155"
                tickLine={false}
              />
              <YAxis domain={[0, 10]} hide />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  fontSize: 11,
                }}
                formatter={(value: number, _: string, props: { payload: ChartEntry }) => {
                  if (value === 0) return ['No entry', ''];
                  return [`${value}/10`, props.payload.mood_type];
                }}
              />
              <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
