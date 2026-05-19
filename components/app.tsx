'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { SessionView } from '@/components/session-view';
import { Toaster } from '@/components/ui/sonner';
import { Welcome } from '@/components/welcome';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import useSessionPersistence from '@/hooks/useSessionPersistence';
import type { CbtData, EmotionSnapshot } from '@/hooks/useSessionPersistence';
import type { AppConfig } from '@/lib/types';
import type { ReceivedChatMessage } from '@livekit/components-react';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails();
  const { startTracking, saveSession } = useSessionPersistence();
  const messagesRef = useRef<ReceivedChatMessage[]>([]);
  const cbtDataRef = useRef<CbtData | null>(null);
  const emotionSnapshotsRef = useRef<EmotionSnapshot[]>([]);

  // Listen for CBT data and emotion data from LiveKit data channel
  useEffect(() => {
    const onDataReceived = (
      payload: Uint8Array,
      participant?: any,
      kind?: any,
      topic?: string
    ) => {
      try {
        const text = new TextDecoder().decode(payload);
        if (topic === 'cbt_data') {
          const data = JSON.parse(text) as CbtData;
          cbtDataRef.current = data;
        } else if (topic === 'emotion_visual') {
          const data = JSON.parse(text);
          // Sample every other snapshot to avoid storing too many (max ~100)
          if (emotionSnapshotsRef.current.length < 100) {
            emotionSnapshotsRef.current.push({
              dominant: data.dominantEmotion,
              top3: data.topEmotions,
              timestamp: Date.now(),
            });
          }
        }
      } catch (e) {
        console.error('Failed to parse data channel message:', e);
      }
    };
    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room]);

  useEffect(() => {
    const onDisconnected = () => {
      // Merge emotion snapshots into CBT data before saving
      const cbtData = cbtDataRef.current;
      if (cbtData && emotionSnapshotsRef.current.length > 0) {
        cbtData.emotions = emotionSnapshotsRef.current;
      } else if (!cbtData && emotionSnapshotsRef.current.length > 0) {
        cbtDataRef.current = {
          mood_ratings: [],
          insights: [],
          homework: null,
          emotions: emotionSnapshotsRef.current,
        };
      }
      saveSession(messagesRef.current, cbtDataRef.current);
      cbtDataRef.current = null;
      emotionSnapshotsRef.current = [];
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails, saveSession]);

  useEffect(() => {
    let aborted = false;
    if (sessionStarted && room.state === 'disconnected' && connectionDetails) {
      // Start tracking session for persistence
      startTracking(connectionDetails.roomName);

      Promise.all([
        room.localParticipant.setMicrophoneEnabled(true, undefined, {
          preConnectBuffer: appConfig.isPreConnectBufferEnabled,
        }),
        room.connect(connectionDetails.serverUrl, connectionDetails.participantToken),
      ]).catch((error) => {
        if (aborted) {
          // Once the effect has cleaned up after itself, drop any errors
          //
          // These errors are likely caused by this effect rerunning rapidly,
          // resulting in a previous run `disconnect` running in parallel with
          // a current run `connect`
          return;
        }

        toastAlert({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      });
    }
    return () => {
      aborted = true;
      room.disconnect();
    };
  }, [room, sessionStarted, connectionDetails, appConfig.isPreConnectBufferEnabled]);

  const { startButtonText } = appConfig;

  return (
    <>
      <MotionWelcome
        key="welcome"
        startButtonText={startButtonText}
        onStartCall={() => setSessionStarted(true)}
        disabled={sessionStarted}
        initial={{ opacity: 0 }}
        animate={{ opacity: sessionStarted ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'linear', delay: sessionStarted ? 0 : 0.5 }}
      />

      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Start Audio" />
        {/* --- */}
        <MotionSessionView
          key="session-view"
          appConfig={appConfig}
          disabled={!sessionStarted}
          sessionStarted={sessionStarted}
          messagesRef={messagesRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: sessionStarted ? 1 : 0 }}
          transition={{
            duration: 0.5,
            ease: 'linear',
            delay: sessionStarted ? 0.5 : 0,
          }}
        />
      </RoomContext.Provider>

      <Toaster />
    </>
  );
}
