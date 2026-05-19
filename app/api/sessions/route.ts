import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * POST /api/sessions — Save a completed therapy session with messages
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { roomName, startedAt, endedAt, durationSeconds, messages, cbtData } = body;

    if (!roomName || !messages || !Array.isArray(messages)) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create the session
    const { data: session, error: sessionError } = await supabase
      .from('therapy_sessions')
      .insert({
        user_id: user.id,
        room_name: roomName,
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        cbt_data: cbtData || null,
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new NextResponse(sessionError.message, { status: 500 });
    }

    // Insert messages
    if (messages.length > 0) {
      const messageRows = messages.map(
        (msg: { role: string; content: string; timestamp: number }) => ({
          session_id: session.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })
      );

      const { error: messagesError } = await supabase
        .from('session_messages')
        .insert(messageRows);

      if (messagesError) {
        console.error('Error saving messages:', messagesError);
        return new NextResponse(messagesError.message, { status: 500 });
      }
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error saving session:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * GET /api/sessions — Retrieve session history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    const { data: sessions, error } = await supabase
      .from('therapy_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching sessions:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
