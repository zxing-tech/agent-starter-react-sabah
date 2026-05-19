'use client';

import { cn } from '@/lib/utils';

interface MoodRating {
  type: string;
  intensity: number;
  timestamp: number;
}

interface CbtInsight {
  situation: string;
  automatic_thought: string;
  distortion: string;
  balanced_thought: string;
  timestamp: number;
}

interface EmotionSnapshot {
  dominant: string;
  top3: Array<{ name: string; score: number }>;
  timestamp: number;
}

interface CbtData {
  mood_ratings?: MoodRating[];
  insights?: CbtInsight[];
  homework?: string | null;
  emotions?: EmotionSnapshot[];
}

interface TherapySession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  summary: string | null;
  cbt_data: CbtData | null;
}

interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SessionDetailProps {
  session: TherapySession;
  messages: SessionMessage[];
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

function formatMessageTime(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function MoodBadge({ mood }: { mood: MoodRating }) {
  const color =
    mood.intensity <= 3
      ? 'bg-green-900/50 text-green-300 border-green-700'
      : mood.intensity <= 6
        ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
        : 'bg-red-900/50 text-red-300 border-red-700';
  return (
    <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', color)}>
      {mood.type} {mood.intensity}/10
    </span>
  );
}

function CbtInsightCard({ insight }: { insight: CbtInsight }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Situation
        </p>
        <p className="text-sm text-slate-300">{insight.situation}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">
          Automatic Thought
        </p>
        <p className="text-sm text-slate-300">{insight.automatic_thought}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          Distortion
        </p>
        <p className="text-sm text-slate-300 capitalize">{insight.distortion}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
          Balanced Thought
        </p>
        <p className="text-sm text-slate-300">{insight.balanced_thought}</p>
      </div>
    </div>
  );
}

export function SessionDetail({ session, messages }: SessionDetailProps) {
  const cbt = session.cbt_data;
  const hasCbtData =
    cbt &&
    ((cbt.mood_ratings && cbt.mood_ratings.length > 0) ||
      (cbt.insights && cbt.insights.length > 0) ||
      cbt.homework ||
      (cbt.emotions && cbt.emotions.length > 0));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <a
          href="/history"
          className="mb-4 inline-flex items-center text-sm text-slate-400 transition-colors hover:text-white"
        >
          &larr; Back to History
        </a>
        <h1 className="text-xl font-semibold text-white">
          {formatDateTime(session.started_at)}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
            {formatDuration(session.duration_seconds)}
          </span>
          <span className="text-xs text-slate-500">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* CBT Summary Panel */}
      {hasCbtData && (
        <div className="mb-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            CBT Session Summary
          </h2>

          {/* Mood Ratings */}
          {cbt.mood_ratings && cbt.mood_ratings.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                Mood Tracking
              </p>
              <div className="flex flex-wrap gap-2">
                {cbt.mood_ratings.map((mood, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-xs text-slate-600">&rarr;</span>
                    )}
                    <MoodBadge mood={mood} />
                  </div>
                ))}
              </div>
              {cbt.mood_ratings.length >= 2 && (
                <p className="mt-2 text-xs text-slate-500">
                  {(() => {
                    const first = cbt.mood_ratings[0];
                    const last = cbt.mood_ratings[cbt.mood_ratings.length - 1];
                    const diff = first.intensity - last.intensity;
                    if (diff > 0)
                      return `${first.type} decreased by ${diff} points during the session`;
                    if (diff < 0)
                      return `${first.type} increased by ${Math.abs(diff)} points during the session`;
                    return `${first.type} stayed at the same level`;
                  })()}
                </p>
              )}
            </div>
          )}

          {/* CBT Insights / Thought Records */}
          {cbt.insights && cbt.insights.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                Thought Records
              </p>
              <div className="space-y-3">
                {cbt.insights.map((insight, i) => (
                  <CbtInsightCard key={i} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Emotion Timeline */}
          {cbt.emotions && cbt.emotions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">
                Facial Emotion Detection
              </p>
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                {/* Emotion frequency summary */}
                {(() => {
                  const freq: Record<string, number> = {};
                  cbt.emotions!.forEach((e) => {
                    freq[e.dominant] = (freq[e.dominant] || 0) + 1;
                  });
                  const sorted = Object.entries(freq)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);
                  const total = cbt.emotions!.length;
                  return (
                    <div className="space-y-2">
                      {sorted.map(([emotion, count]) => {
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={emotion}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="capitalize text-slate-300">{emotion}</span>
                              <span className="text-slate-500">{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                              <div
                                className="h-full rounded-full bg-purple-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <p className="mt-3 text-[10px] text-slate-500">
                  Based on {cbt.emotions.length} facial expression samples during the session
                </p>
              </div>
            </div>
          )}

          {/* Homework */}
          {cbt.homework && (
            <div className="rounded-xl border border-indigo-700/50 bg-indigo-950/30 p-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                Homework Assignment
              </p>
              <p className="text-sm text-slate-300">{cbt.homework}</p>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200'
              )}
            >
              <p className="mb-1 text-xs font-medium opacity-70">
                {msg.role === 'user' ? 'You' : 'Theraverse'}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              <p className="mt-1 text-[10px] opacity-50">
                {formatMessageTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-sm text-slate-400">
              No messages recorded for this session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
