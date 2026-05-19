'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RppgProcessor, type RppgResult } from '@/lib/rppg-processor';
import type { Room } from 'livekit-client';

// MediaPipe Face Mesh landmark indices for ROI extraction
// Forehead region
const FOREHEAD_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
// Left cheek
const LEFT_CHEEK_LANDMARKS = [50, 101, 36, 5, 4, 1, 19, 94, 125, 142, 203, 206, 216, 212, 202, 210, 169];
// Right cheek
const RIGHT_CHEEK_LANDMARKS = [280, 330, 266, 5, 4, 1, 19, 94, 354, 371, 423, 426, 436, 432, 422, 430, 394];

const PROCESS_INTERVAL_MS = 33; // ~30fps

export function useRppg(
  enabled: boolean,
  room: Room | null,
  videoStream: MediaStream | null // Reuse the emotion detection camera stream
) {
  const [result, setResult] = useState<RppgResult | null>(null);
  const [isActive, setIsActive] = useState(false);
  const processorRef = useRef<RppgProcessor>(new RppgProcessor());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastProcessRef = useRef<number>(0);
  const publishIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (publishIntervalRef.current) {
      clearInterval(publishIntervalRef.current);
      publishIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    processorRef.current.reset();
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!enabled || !videoStream) {
      cleanup();
      return;
    }

    let cancelled = false;

    async function start() {
      // Create video element from existing stream
      const video = document.createElement('video');
      video.srcObject = videoStream;
      video.muted = true;
      video.playsInline = true;

      try {
        await video.play();
      } catch {
        return;
      }

      if (cancelled) return;
      videoRef.current = video;

      // Canvas for pixel extraction
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      canvasRef.current = canvas;

      setIsActive(true);

      // Frame processing loop using requestAnimationFrame
      function processFrame() {
        if (cancelled) return;

        const now = performance.now();
        if (now - lastProcessRef.current >= PROCESS_INTERVAL_MS) {
          lastProcessRef.current = now;
          extractAndProcess();
        }

        rafRef.current = requestAnimationFrame(processFrame);
      }

      rafRef.current = requestAnimationFrame(processFrame);

      // Publish results to agent every 3 seconds
      publishIntervalRef.current = setInterval(() => {
        const r = processorRef.current.process();
        if (r && r.bpm > 0 && r.confidence > 0.3) {
          setResult(r);

          // Send to agent via data channel
          if (room) {
            try {
              const payload = JSON.stringify({
                bpm: r.bpm,
                hrv: r.hrv,
                stressLevel: r.stressLevel,
                confidence: Math.round(r.confidence * 100),
              });
              room.localParticipant.publishData(
                new TextEncoder().encode(payload),
                { reliable: true, topic: 'rppg_vitals' }
              );
            } catch {}
          }
        }
      }, 3000);
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, videoStream, room, cleanup]);

  function extractAndProcess() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 160, 120);
    const imageData = ctx.getImageData(0, 0, 160, 120);

    const { r, g, b } = extractFaceROI(imageData, 160, 120);

    processorRef.current.addSample(r, g, b);
  }

  return { result, isActive };
}

/**
 * Extract average RGB from estimated face skin regions.
 * Uses the central face area as an approximation when MediaPipe is not available.
 * Forehead: top 20-35% vertically, center 30-70% horizontally
 * Cheeks: 40-60% vertically, 15-40% and 60-85% horizontally
 */
function extractFaceROI(
  imageData: ImageData,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  const data = imageData.data;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  const regions = [
    // Forehead
    { y0: 0.2, y1: 0.35, x0: 0.3, x1: 0.7 },
    // Left cheek
    { y0: 0.4, y1: 0.6, x0: 0.15, x1: 0.35 },
    // Right cheek
    { y0: 0.4, y1: 0.6, x0: 0.65, x1: 0.85 },
  ];

  for (const region of regions) {
    for (let y = Math.floor(height * region.y0); y < Math.floor(height * region.y1); y += 2) {
      for (let x = Math.floor(width * region.x0); x < Math.floor(width * region.x1); x += 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Skin color filter: exclude very dark, very bright, and blue-dominant pixels
        const brightness = (r + g + b) / 3;
        if (brightness > 40 && brightness < 220 && b < r * 1.1 && b < g * 1.1) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
    }
  }

  if (count === 0) return { r: 0, g: 0, b: 0 };
  return { r: rSum / count, g: gSum / count, b: bSum / count };
}
