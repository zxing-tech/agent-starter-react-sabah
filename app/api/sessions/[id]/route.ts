import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * GET /api/sessions/[id] — Retrieve a single session with all messages
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;

    const { data: session, error: sessionError } = await supabase
      .from('therapy_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return new NextResponse('Session not found', { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('session_messages')
      .select('*')
      .eq('session_id', id)
      .order('timestamp', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new NextResponse(messagesError.message, { status: 500 });
    }

    return NextResponse.json({ session, messages });
  } catch (error) {
    console.error('Error fetching session:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
