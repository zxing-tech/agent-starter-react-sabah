'use client';

import type { RppgResult } from '@/lib/rppg-processor';

const STRESS_COLORS = {
  low: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  moderate: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  high: 'text-red-400 border-red-500/30 bg-red-500/10',
};

interface VitalsIndicatorProps {
  result: RppgResult | null;
  isActive: boolean;
}

export function VitalsIndicator({ result, isActive }: VitalsIndicatorProps) {
  if (!isActive) return null;

  if (!result || result.bpm === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[10px] text-white/40 animate-pulse">Calibrating vitals…</span>
        </div>
      </div>
    );
  }

  const stressClass = STRESS_COLORS[result.stressLevel];

  return (
    <div>
      <div
        className={`flex items-center gap-3 rounded-full border px-3 py-1.5 backdrop-blur-md ${stressClass}`}
      >
        {/* Heart rate */}
        <div className="flex items-center gap-1">
          <span className="text-sm animate-pulse">❤️</span>
          <span className="text-xs font-bold">{result.bpm}</span>
          <span className="text-[10px] opacity-60">BPM</span>
        </div>

        <div className="h-3 w-px bg-current opacity-20" />

        {/* HRV */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] opacity-60">HRV</span>
          <span className="text-xs font-bold">{result.hrv}</span>
          <span className="text-[10px] opacity-60">ms</span>
        </div>

        <div className="h-3 w-px bg-current opacity-20" />

        {/* SpO2 */}
        <div className="flex items-center gap-1" title="Estimated SpO2 — approximate, not medical-grade">
          <span className="text-sm">🫁</span>
          <span className="text-xs font-bold">{result.spo2}</span>
          <span className="text-[10px] opacity-60">%</span>
        </div>

        {/* Confidence dot */}
        {result.confidence < 0.5 && (
          <span className="text-[10px] opacity-50" title="Low signal quality">
            ~
          </span>
        )}
      </div>
    </div>
  );
}
