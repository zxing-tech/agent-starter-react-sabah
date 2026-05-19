import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * GET /api/sessions/recent — Get recent session summaries for context continuity
 * Returns the last 3 sessions with their messages, used to provide
 * the AI agent with prior conversation context.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch last 3 sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('therapy_sessions')
      .select('id, started_at, ended_at, duration_seconds, summary, cbt_data')
      .order('started_at', { ascending: false })
      .limit(3);

    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError);
      return new NextResponse(sessionsError.message, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [], isReturningUser: false });
    }

    // Fetch messages for these sessions
    const sessionIds = sessions.map((s) => s.id);
    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select('session_id, role, content, timestamp')
      .in('session_id', sessionIds)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new NextResponse(messagesError.message, { status: 500 });
    }

    // Group messages by session
    const sessionsWithMessages = sessions.map((session) => ({
      ...session,
      messages: (messages ?? []).filter((m) => m.session_id === session.id),
    }));

    return NextResponse.json({
      sessions: sessionsWithMessages,
      isReturningUser: true,
    });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
