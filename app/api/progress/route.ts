import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

interface MoodRating {
  type: string;
  intensity: number;
  timestamp: number;
}

interface CbtInsight {
  situation: string;
  automatic_thought: string;
  distortion: string;
  balanced_thought: string;
  timestamp: number;
}

interface CbtData {
  mood_ratings?: MoodRating[];
  insights?: CbtInsight[];
  homework?: string | null;
}

interface SessionRow {
  id: string;
  started_at: string;
  duration_seconds: number | null;
  cbt_data: CbtData | null;
}

/**
 * GET /api/progress — Aggregate CBT progress data for the authenticated user
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
    const range = searchParams.get('range') ?? '30'; // days
    const daysAgo = parseInt(range, 10);
    const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error } = await supabase
      .from('therapy_sessions')
      .select('id, started_at, duration_seconds, cbt_data')
      .gte('started_at', since)
      .order('started_at', { ascending: true });

    if (error) {
      console.error('Error fetching progress:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    const typedSessions = (sessions ?? []) as SessionRow[];

    // Total stats
    const totalSessions = typedSessions.length;
    const totalTimeSeconds = typedSessions.reduce(
      (sum, s) => sum + (s.duration_seconds ?? 0),
      0
    );
    const avgDurationSeconds =
      totalSessions > 0 ? Math.round(totalTimeSeconds / totalSessions) : 0;

    // Mood trajectory: extract first and last mood per session
    const moodTrajectory: Array<{
      date: string;
      startMood: number;
      endMood: number;
      moodType: string;
    }> = [];

    typedSessions.forEach((s) => {
      const moods = s.cbt_data?.mood_ratings;
      if (moods && moods.length >= 2) {
        const first = moods[0];
        const last = moods[moods.length - 1];
        moodTrajectory.push({
          date: new Date(s.started_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          startMood: first.intensity,
          endMood: last.intensity,
          moodType: first.type,
        });
      }
    });

    // Distortion frequency
    const distortionCounts: Record<string, number> = {};
    typedSessions.forEach((s) => {
      const insights = s.cbt_data?.insights;
      if (insights) {
        insights.forEach((i) => {
          const d = i.distortion.toLowerCase();
          distortionCounts[d] = (distortionCounts[d] || 0) + 1;
        });
      }
    });

    const distortions = Object.entries(distortionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Homework stats
    const sessionsWithHomework = typedSessions.filter(
      (s) => s.cbt_data?.homework
    ).length;
    const homeworkRate =
      totalSessions > 0
        ? Math.round((sessionsWithHomework / totalSessions) * 100)
        : 0;

    // Thought records count
    const totalThoughtRecords = typedSessions.reduce((sum, s) => {
      return sum + (s.cbt_data?.insights?.length ?? 0);
    }, 0);

    return NextResponse.json({
      totalSessions,
      totalTimeSeconds,
      avgDurationSeconds,
      moodTrajectory,
      distortions,
      homeworkRate,
      sessionsWithHomework,
      totalThoughtRecords,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
