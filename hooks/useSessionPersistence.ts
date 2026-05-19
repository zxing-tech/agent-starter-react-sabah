import { useCallback, useRef } from 'react';
import type { ReceivedChatMessage } from '@livekit/components-react';

export interface EmotionSnapshot {
  dominant: string;
  top3: Array<{ name: string; score: number }>;
  timestamp: number;
}

export interface CbtData {
  mood_ratings: Array<{
    type: string;
    intensity: number;
    timestamp: number;
  }>;
  insights: Array<{
    situation: string;
    automatic_thought: string;
    distortion: string;
    balanced_thought: string;
    timestamp: number;
  }>;
  homework: string | null;
  emotions?: EmotionSnapshot[];
}

interface SessionData {
  roomName: string;
  startedAt: string;
}

export default function useSessionPersistence() {
  const sessionDataRef = useRef<SessionData | null>(null);

  const startTracking = useCallback((roomName: string) => {
    sessionDataRef.current = {
      roomName,
      startedAt: new Date().toISOString(),
    };
  }, []);

  const saveSession = useCallback(
    async (messages: ReceivedChatMessage[], cbtData?: CbtData | null) => {
      const sessionData = sessionDataRef.current;
      if (!sessionData || messages.length === 0) return;

      const endedAt = new Date().toISOString();
      const startTime = new Date(sessionData.startedAt).getTime();
      const endTime = new Date(endedAt).getTime();
      const durationSeconds = Math.round((endTime - startTime) / 1000);

      const payload = {
        roomName: sessionData.roomName,
        startedAt: sessionData.startedAt,
        endedAt,
        durationSeconds,
        messages: messages.map((msg) => ({
          role: msg.from?.isAgent ? 'assistant' : 'user',
          content: msg.message,
          timestamp: msg.timestamp,
        })),
        cbtData: cbtData || null,
      };

      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('Failed to save session:', await res.text());
        }
      } catch (error) {
        console.error('Error saving session:', error);
      } finally {
        sessionDataRef.current = null;
      }
    },
    []
  );

  return { startTracking, saveSession };
}
