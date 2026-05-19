import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * GET /api/sessions/streak — Get session count this month and weekly streak
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

    // Sessions this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthSessions } = await supabase
      .from('therapy_sessions')
      .select('id')
      .gte('started_at', startOfMonth.toISOString());

    const sessionsThisMonth = monthSessions?.length ?? 0;

    // Calculate weekly streak: consecutive weeks (going back) with at least 1 session
    const { data: allSessions } = await supabase
      .from('therapy_sessions')
      .select('started_at')
      .order('started_at', { ascending: false })
      .limit(100);

    let weekStreak = 0;

    if (allSessions && allSessions.length > 0) {
      const now = new Date();
      // Check if there's a session in the current week
      const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      };

      const currentWeekStart = getWeekStart(now);

      // Group sessions by week
      const sessionWeeks = new Set<number>();
      for (const s of allSessions) {
        sessionWeeks.add(getWeekStart(new Date(s.started_at)));
      }

      // Count consecutive weeks going backwards
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      let checkWeek = currentWeekStart;

      while (sessionWeeks.has(checkWeek)) {
        weekStreak++;
        checkWeek -= oneWeek;
      }

      // If no session this week but last session was less than 7 days ago, still count
      if (weekStreak === 0 && allSessions.length > 0) {
        const lastSession = new Date(allSessions[0].started_at);
        const daysSince = Math.floor(
          (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < 7) {
          // Count from last week
          checkWeek = getWeekStart(lastSession);
          while (sessionWeeks.has(checkWeek)) {
            weekStreak++;
            checkWeek -= oneWeek;
          }
        }
      }
    }

    const lastSessionDate =
      allSessions && allSessions.length > 0
        ? allSessions[0].started_at
        : null;

    return NextResponse.json({
      sessionsThisMonth,
      weekStreak,
      lastSessionDate,
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
