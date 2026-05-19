'use client';

import React, { type MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
  useTranscriptions,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import { EmotionIndicator } from '@/components/emotion-indicator';
import { VitalsIndicator } from '@/components/vitals-indicator';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CrisisContact {
  name: string;
  number: string;
  description: string;
}

interface CrisisAlert {
  crisis: boolean;
  reason: string;
  contacts: CrisisContact[];
}

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  messagesRef?: MutableRefObject<ReceivedChatMessage[]>;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  messagesRef,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [humeApiKey, setHumeApiKey] = useState<string | null>(null);
  const { messages, send } = useChatAndTranscription();

  // Sync messages to parent ref for persistence on disconnect
  useEffect(() => {
    if (messagesRef) {
      messagesRef.current = messages;
    }
  }, [messages, messagesRef]);
  const transcriptions = useTranscriptions();
  const room = useRoomContext();

  // Fetch Hume API key for emotion detection
  useEffect(() => {
    if (sessionStarted) {
      fetch('/api/hume-key')
        .then((res) => res.ok ? res.json() : null)
        .then((d) => { if (d?.apiKey) setHumeApiKey(d.apiKey); })
        .catch(() => {});
    }
  }, [sessionStarted]);

  // Emotion detection via Hume AI
  const { emotionState, isConnected: emotionConnected, videoStream } = useEmotionDetection(
    humeApiKey,
    sessionStarted,
    room
  );

  const rppgResult = null;
  const rppgActive = false;

  // Listen for crisis alerts from the agent via data channel
  useEffect(() => {
    const onDataReceived = (
      payload: Uint8Array,
      _participant?: unknown,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic === 'crisis_alert') {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload)) as CrisisAlert;
          if (data.crisis) {
            setCrisisAlert(data);
          }
        } catch (e) {
          console.error('Failed to parse crisis alert:', e);
        }
      }
    };
    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room]);

  useDebugMode();

  // 3-minute session timer
  const MAX_SESSION_SECONDS = 30 * 60;
  const [timeRemaining, setTimeRemaining] = useState(MAX_SESSION_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sessionStarted) {
      setTimeRemaining(MAX_SESSION_SECONDS);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            toastAlert({
              title: 'Session ended',
              description: <p className="w-full">Your 3-minute session has ended. Start a new conversation to continue.</p>,
            });
            room.disconnect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [sessionStarted, room]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  async function handleSendMessage(message: string) {
    await send(message);
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 30_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <main
      ref={ref}
      inert={disabled}
      className={cn(
        'bg-slate-900 min-h-screen',
        !chatOpen && 'max-h-svh overflow-hidden'
      )}
    >
      {/* Session Status Bar (below app navbar) */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-slate-800/60 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-1.5 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>Connected</span>
          </div>
          <div className={cn(
            'font-mono text-sm font-semibold px-2 py-0.5 rounded',
            timeRemaining <= 30 ? 'text-red-400 bg-red-500/10' : 'text-slate-300'
          )}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Live Transcription Overlay */}
      {transcriptions.length > 0 && (
        <div className="fixed top-24 left-4 right-4 z-[60] flex justify-center sm:top-28">
          <div className="bg-black/70 text-white px-5 py-3 rounded-xl text-sm font-medium backdrop-blur-md border border-white/20 shadow-lg max-w-[90vw] sm:max-w-lg text-center">
            {transcriptions[transcriptions.length - 1].text}
          </div>
        </div>
      )}

      {/* Crisis Emergency Banner */}
      {crisisAlert && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-0 right-0 z-[70] px-4 sm:px-6"
        >
          <div className="mx-auto max-w-lg rounded-xl border border-red-500/50 bg-red-950/90 p-4 backdrop-blur-md shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-bold text-red-300">
                You are not alone — help is available
              </h3>
            </div>
            <div className="space-y-2">
              {crisisAlert.contacts.map((contact) => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center justify-between rounded-lg bg-red-900/50 px-3 py-2 transition-colors hover:bg-red-800/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{contact.name}</p>
                    <p className="text-xs text-red-300">{contact.description}</p>
                  </div>
                  <span className="text-sm font-mono font-bold text-white">{contact.number}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat Messages */}
      <ChatMessageView
        className={cn(
          'mx-auto min-h-svh w-full max-w-2xl px-4 pt-24 pb-32 transition-[opacity,translate] duration-300 ease-out',
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <ChatEntry hideName key={message.id} entry={message} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      {/* Video Area */}
      <div className="pt-16 pb-24">
        <MediaTiles chatOpen={chatOpen} />
      </div>

      {/* Vitals + Emotion Indicators (side by side) */}
      <div className="fixed bottom-28 left-1/2 z-[55] -translate-x-1/2 flex items-center gap-2">
        <VitalsIndicator result={rppgResult} isActive={rppgActive} />
        <EmotionIndicator emotionState={emotionState} isConnected={emotionConnected} />
      </div>

      {/* Control Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-50 px-4 pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <div className="inline-flex items-center space-x-2 bg-slate-800/90 backdrop-blur-sm px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-slate-300">
                    AI Assistant is listening
                  </p>
                </div>
              </motion.div>
            )}

            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-4">
              <AgentControlBar
                capabilities={capabilities}
                onChatOpenChange={setChatOpen}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};
