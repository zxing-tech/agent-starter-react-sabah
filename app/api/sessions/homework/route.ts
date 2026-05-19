import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * GET /api/sessions/homework — Get pending homework from the most recent session
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

    // Get the most recent session with homework
    const { data: sessions } = await supabase
      .from('therapy_sessions')
      .select('id, started_at, cbt_data')
      .not('cbt_data', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ homework: null });
    }

    // Find the most recent session that has homework
    for (const session of sessions) {
      const cbtData = session.cbt_data as {
        homework?: string | null;
      } | null;

      if (cbtData?.homework) {
        return NextResponse.json({
          homework: cbtData.homework,
          sessionDate: session.started_at,
          sessionId: session.id,
        });
      }
    }

    return NextResponse.json({ homework: null });
  } catch (error) {
    console.error('Error fetching homework:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
