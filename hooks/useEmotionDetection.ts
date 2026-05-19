'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Room } from 'livekit-client';

export interface EmotionScore {
  name: string;
  score: number;
}

export interface EmotionState {
  topEmotions: EmotionScore[];
  dominantEmotion: string;
  timestamp: number;
}

const CAPTURE_INTERVAL_MS = 4000;
const TOP_N_EMOTIONS = 5;
const HUME_WS_URL = 'wss://api.hume.ai/v0/stream/models';

const EMOTION_SIMPLIFY: Record<string, string> = {
  'Anxiety': 'anxious',
  'Distress': 'distressed',
  'Sadness': 'sad',
  'Joy': 'happy',
  'Anger': 'angry',
  'Fear': 'fearful',
  'Surprise (positive)': 'surprised',
  'Surprise (negative)': 'startled',
  'Contempt': 'contempt',
  'Disgust': 'disgusted',
  'Calmness': 'calm',
  'Confusion': 'confused',
  'Concentration': 'focused',
  'Tiredness': 'tired',
  'Boredom': 'bored',
  'Interest': 'interested',
  'Empathic Pain': 'empathic pain',
  'Amusement': 'amused',
  'Determination': 'determined',
  'Contemplation': 'thoughtful',
};

export function useEmotionDetection(
  apiKey: string | null,
  enabled: boolean,
  room: Room | null
) {
  const [emotionState, setEmotionState] = useState<EmotionState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!apiKey || !enabled) {
      cleanup();
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        // Get camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        // Hidden video element
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        // Canvas for frame capture
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvasRef.current = canvas;

        // Connect to Hume via raw WebSocket
        const ws = new WebSocket(`${HUME_WS_URL}?apikey=${apiKey}`);
        if (cancelled) { ws.close(); return; }
        wsRef.current = ws;

        ws.onopen = () => {
          if (!cancelled) {
            setIsConnected(true);
            console.log('✓ Hume emotion detection connected');
          }
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const message = JSON.parse(event.data);

            // Check for errors
            if (message.error) {
              console.error('Hume error:', message.error);
              return;
            }

            const facePreds = message?.face?.predictions;
            if (facePreds && facePreds.length > 0) {
              const emotions: EmotionScore[] = facePreds[0].emotions ?? [];
              const sorted = [...emotions]
                .sort((a, b) => b.score - a.score)
                .slice(0, TOP_N_EMOTIONS);

              const dominant = sorted[0]?.name ?? 'neutral';

              const state: EmotionState = {
                topEmotions: sorted,
                dominantEmotion: EMOTION_SIMPLIFY[dominant] ?? dominant.toLowerCase(),
                timestamp: Date.now(),
              };

              setEmotionState(state);

              // Send to agent via LiveKit data channel
              if (room) {
                try {
                  const payload = JSON.stringify({
                    dominantEmotion: state.dominantEmotion,
                    topEmotions: sorted.slice(0, 3).map((e) => ({
                      name: EMOTION_SIMPLIFY[e.name] ?? e.name.toLowerCase(),
                      score: Math.round(e.score * 100) / 100,
                    })),
                  });
                  room.localParticipant.publishData(
                    new TextEncoder().encode(payload),
                    { reliable: true, topic: 'emotion_visual' }
                  );
                } catch {}
              }
            }
          } catch (e) {
            console.error('Hume message parse error:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('Hume WebSocket error:', error);
        };

        ws.onclose = () => {
          if (!cancelled) setIsConnected(false);
        };

        // Wait for connection before sending frames
        await new Promise<void>((resolve) => {
          if (ws.readyState === WebSocket.OPEN) { resolve(); return; }
          const orig = ws.onopen;
          ws.onopen = (e) => {
            if (orig) (orig as (e: Event) => void)(e);
            resolve();
          };
        });

        // Start periodic frame capture
        intervalRef.current = setInterval(() => {
          if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
          if (wsRef.current.readyState !== WebSocket.OPEN) return;

          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);
          const base64 = dataUrl.split(',')[1];

          const payload = JSON.stringify({
            data: base64,
            models: { face: {} },
          });

          try {
            wsRef.current.send(payload);
          } catch (e) {
            console.error('Failed to send frame to Hume:', e);
          }
        }, CAPTURE_INTERVAL_MS);
      } catch (e) {
        console.error('Failed to start emotion detection:', e);
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [apiKey, enabled, room, cleanup]);

  return { emotionState, isConnected, videoStream: streamRef.current };
}
