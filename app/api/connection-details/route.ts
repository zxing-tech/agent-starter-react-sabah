import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase/server';

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function GET() {
  try {
    // Check Supabase session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Generate participant token using authenticated user info
    const participantName = user.email ?? 'user';
    const participantIdentity = user.id;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    // Fetch recent session context for continuity (including CBT data)
    const { data: recentSessions } = await supabase
      .from('therapy_sessions')
      .select('id, started_at, duration_seconds, summary, cbt_data')
      .order('started_at', { ascending: false })
      .limit(3);

    let sessionContext = '';
    if (recentSessions && recentSessions.length > 0) {
      const sessionIds = recentSessions.map((s: { id: string }) => s.id);
      const { data: recentMessages } = await supabase
        .from('session_messages')
        .select('session_id, role, content')
        .in('session_id', sessionIds)
        .order('timestamp', { ascending: true });

      interface RecentSession {
        id: string;
        started_at: string;
        duration_seconds: number | null;
        summary: string | null;
        cbt_data: {
          mood_ratings?: Array<{ type: string; intensity: number }>;
          insights?: Array<{
            situation: string;
            automatic_thought: string;
            distortion: string;
            balanced_thought: string;
          }>;
          homework?: string | null;
        } | null;
      }

      const sessionSummaries = recentSessions.map((s: RecentSession) => {
        const msgs = (recentMessages ?? [])
          .filter((m: { session_id: string }) => m.session_id === s.id)
          .slice(-6) // last 6 messages per session
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join('\n');
        const date = new Date(s.started_at).toLocaleDateString();

        let cbtSummary = '';
        if (s.cbt_data) {
          const parts: string[] = [];

          // Include mood trajectory
          if (s.cbt_data.mood_ratings && s.cbt_data.mood_ratings.length > 0) {
            const moods = s.cbt_data.mood_ratings;
            const first = moods[0];
            const last = moods[moods.length - 1];
            parts.push(
              `Mood: ${first.type} ${first.intensity}/10 → ${last.type} ${last.intensity}/10`
            );
          }

          // Include distortions identified
          if (s.cbt_data.insights && s.cbt_data.insights.length > 0) {
            const distortions = s.cbt_data.insights
              .map((i) => `${i.distortion} (re: "${i.situation}")`)
              .join(', ');
            parts.push(`Distortions identified: ${distortions}`);
          }

          // Include homework
          if (s.cbt_data.homework) {
            parts.push(`Homework assigned: ${s.cbt_data.homework}`);
          }

          if (parts.length > 0) {
            cbtSummary = '\nCBT Data: ' + parts.join(' | ');
          }
        }

        return `[Session ${date}]\n${msgs}${cbtSummary}`;
      });

      // Add homework reminder if the most recent session had homework
      const lastSession = recentSessions[0] as RecentSession;
      if (lastSession?.cbt_data?.homework) {
        sessionContext =
          `[HOMEWORK FROM LAST SESSION]: ${lastSession.cbt_data.homework}\n` +
          `Ask the user how their homework went before diving into new topics.\n\n`;
      }

      sessionContext += sessionSummaries.join('\n\n');
    }

    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: participantName,
        metadata: sessionContext ? JSON.stringify({ sessionContext }) : undefined,
      },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
