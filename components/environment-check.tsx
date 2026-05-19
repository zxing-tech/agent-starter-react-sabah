'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface CheckResult {
  level: number; // 0-100
  status: 'poor' | 'fair' | 'good' | 'excellent';
  label: string;
}

function getStatus(level: number): CheckResult['status'] {
  if (level >= 80) return 'excellent';
  if (level >= 60) return 'good';
  if (level >= 35) return 'fair';
  return 'poor';
}

const STATUS_COLORS = {
  excellent: 'bg-emerald-500',
  good: 'bg-emerald-400',
  fair: 'bg-amber-400',
  poor: 'bg-red-400',
};

const STATUS_TEXT_COLORS = {
  excellent: 'text-emerald-400',
  good: 'text-emerald-400',
  fair: 'text-amber-400',
  poor: 'text-red-400',
};

const STATUS_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

const STATUS_TIPS: Record<string, Record<string, string>> = {
  lighting: {
    poor: 'Turn on a light facing you, or move closer to a window',
    fair: 'A bit more light on your face would help',
  },
  stability: {
    poor: 'Place your device on a stable surface',
    fair: 'Try to keep your device steady',
  },
  microphone: {
    poor: 'Move closer to your microphone or check mic permissions',
    fair: 'Move a bit closer to your microphone',
  },
  noise: {
    poor: 'Find a quieter space or use headphones',
    fair: 'Some background noise detected — headphones may help',
  },
};

function GaugeRow({
  icon,
  name,
  check,
  tip,
}: {
  icon: string;
  name: string;
  check: CheckResult;
  tip?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium text-slate-300">{name}</span>
        </div>
        <span
          className={`text-xs font-semibold ${STATUS_TEXT_COLORS[check.status]}`}
        >
          {STATUS_LABELS[check.status]}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[check.status]}`}
          style={{ width: `${check.level}%` }}
        />
      </div>
      {tip && (
        <p className="text-[11px] text-slate-500">{tip}</p>
      )}
    </div>
  );
}

interface EnvironmentCheckProps {
  onReady: () => void;
  onSkip: () => void;
}

export function EnvironmentCheck({ onReady, onSkip }: EnvironmentCheckProps) {
  const [lighting, setLighting] = useState<CheckResult>({ level: 0, status: 'poor', label: '' });
  const [stability, setStability] = useState<CheckResult>({ level: 0, status: 'poor', label: '' });
  const [microphone, setMicrophone] = useState<CheckResult>({ level: 0, status: 'poor', label: '' });
  const [noise, setNoise] = useState<CheckResult>({ level: 0, status: 'poor', label: '' });
  const [checking, setChecking] = useState(true);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Video setup
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvasRef.current = canvas;

        // Audio setup
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Run checks every 500ms
        intervalRef.current = setInterval(() => {
          if (cancelled) return;
          checkLighting();
          checkStability();
          checkAudio();
        }, 500);

        // Update camera preview
        setInterval(() => {
          if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 320, 240);
              setCameraPreview(canvasRef.current.toDataURL('image/jpeg', 0.6));
            }
          }
        }, 1000);

        setTimeout(() => setChecking(false), 2000);
      } catch (e) {
        console.error('Environment check failed:', e);
        // If camera/mic not available, set defaults and allow skip
        setLighting({ level: 50, status: 'fair', label: '' });
        setStability({ level: 80, status: 'good', label: '' });
        setMicrophone({ level: 50, status: 'fair', label: '' });
        setNoise({ level: 70, status: 'good', label: '' });
        setChecking(false);
      }
    }

    function checkLighting() {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const imageData = ctx.getImageData(0, 0, 320, 240);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      const avgBrightness = totalBrightness / (data.length / 4);
      // Map 0-255 brightness to 0-100 score (40-180 is the useful range)
      const level = Math.min(100, Math.max(0, ((avgBrightness - 30) / 150) * 100));

      setLighting({ level, status: getStatus(level), label: '' });
    }

    function checkStability() {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, 320, 240);

      if (prevFrameRef.current) {
        const prev = prevFrameRef.current.data;
        const curr = imageData.data;
        let diffSum = 0;
        const sampleStep = 40; // Sample every 10th pixel for performance

        for (let i = 0; i < curr.length; i += sampleStep) {
          diffSum += Math.abs(curr[i] - prev[i]);
        }

        const avgDiff = diffSum / (curr.length / sampleStep);
        // Low diff = stable, high diff = shaky. Map inversely.
        const level = Math.min(100, Math.max(0, 100 - avgDiff * 4));
        setStability({ level, status: getStatus(level), label: '' });
      }

      prevFrameRef.current = imageData;
    }

    function checkAudio() {
      if (!analyserRef.current) return;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avgVolume = sum / bufferLength;

      // Mic level: higher is better (means mic is picking up)
      const micLevel = Math.min(100, avgVolume * 2.5);
      setMicrophone({ level: Math.max(micLevel, 20), status: getStatus(Math.max(micLevel, 20)), label: '' });

      // Noise: analyze high-frequency content (background noise tends to be broadband)
      let highFreqSum = 0;
      const highStart = Math.floor(bufferLength * 0.6);
      for (let i = highStart; i < bufferLength; i++) {
        highFreqSum += dataArray[i];
      }
      const highFreqAvg = highFreqSum / (bufferLength - highStart);
      // Lower noise is better — invert
      const noiseLevel = Math.min(100, Math.max(0, 100 - highFreqAvg * 3));
      setNoise({ level: noiseLevel, status: getStatus(noiseLevel), label: '' });
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [cleanup]);

  const allGood =
    lighting.status !== 'poor' &&
    stability.status !== 'poor' &&
    microphone.status !== 'poor' &&
    noise.status !== 'poor';

  return (
    <div className="mx-auto max-w-md px-4">
      <h2 className="mb-1 text-lg font-semibold text-white text-center">
        Environment Check
      </h2>
      <p className="mb-5 text-center text-xs text-slate-400">
        Let's make sure your setup is ready for a good session
      </p>

      {/* Camera Preview */}
      {cameraPreview && (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-700">
          <img
            src={cameraPreview}
            alt="Camera preview"
            className="w-full h-auto"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
      )}

      {/* Gauges */}
      <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <GaugeRow
          icon="🔆"
          name="Lighting"
          check={lighting}
          tip={STATUS_TIPS.lighting[lighting.status]}
        />
        <GaugeRow
          icon="📷"
          name="Stability"
          check={stability}
          tip={STATUS_TIPS.stability[stability.status]}
        />
        <GaugeRow
          icon="🎤"
          name="Microphone"
          check={microphone}
          tip={STATUS_TIPS.microphone[microphone.status]}
        />
        <GaugeRow
          icon="🔇"
          name="Background Noise"
          check={noise}
          tip={STATUS_TIPS.noise[noise.status]}
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={() => { cleanup(); onReady(); }}
          disabled={checking}
          className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-all ${
            allGood
              ? 'bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-500 hover:to-cyan-400'
              : 'bg-amber-600 hover:bg-amber-500'
          } disabled:opacity-50`}
        >
          {checking
            ? 'Checking...'
            : allGood
              ? 'All Clear — Start Session'
              : 'Continue Anyway'}
        </button>
        <button
          onClick={() => { cleanup(); onSkip(); }}
          className="w-full rounded-xl py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
        >
          Skip check
        </button>
      </div>
    </div>
  );
}
