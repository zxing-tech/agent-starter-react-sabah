'use client';

import type { EmotionState } from '@/hooks/useEmotionDetection';

const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  anxious: '😰',
  angry: '😤',
  fearful: '😨',
  surprised: '😲',
  startled: '😳',
  disgusted: '🤢',
  confused: '😕',
  focused: '🧐',
  tired: '😴',
  bored: '😑',
  interested: '🤔',
  amused: '😄',
  determined: '💪',
  thoughtful: '🤔',
  distressed: '😣',
  contempt: '😒',
  'empathic pain': '💔',
  neutral: '😐',
};

const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  calm: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  sad: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  anxious: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  angry: 'bg-red-500/20 text-red-400 border-red-500/30',
  fearful: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  distressed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  focused: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  interested: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

interface EmotionIndicatorProps {
  emotionState: EmotionState | null;
  isConnected: boolean;
}

export function EmotionIndicator({ emotionState, isConnected }: EmotionIndicatorProps) {
  if (!isConnected) return null;

  const dominant = emotionState?.dominantEmotion ?? 'neutral';
  const emoji = EMOTION_EMOJI[dominant] ?? '😐';
  const colorClass = EMOTION_COLORS[dominant] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  const topThree = emotionState?.topEmotions.slice(0, 3) ?? [];

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${colorClass}`}
      >
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-medium capitalize">{dominant}</span>
        {topThree.length > 1 && (
          <div className="flex items-center gap-1 border-l border-current/20 pl-2">
            {topThree.slice(1).map((e, i) => {
              const name = e.name.toLowerCase();
              const em = EMOTION_EMOJI[name] ?? '';
              return (
                <span key={i} className="text-[10px] opacity-70" title={`${name}: ${Math.round(e.score * 100)}%`}>
                  {em || name.slice(0, 3)}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
