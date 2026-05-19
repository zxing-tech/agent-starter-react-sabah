import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * POST /api/mood-journal — Log a mood entry
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

    const { moodType, intensity } = await request.json();

    if (!moodType || intensity === undefined) {
      return new NextResponse('Missing moodType or intensity', { status: 400 });
    }

    const { data, error } = await supabase
      .from('mood_journal')
      .insert({
        user_id: user.id,
        mood_type: moodType,
        intensity: Math.max(0, Math.min(10, intensity)),
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error saving mood:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({ id: data.id, created_at: data.created_at });
  } catch (error) {
    console.error('Error saving mood:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * GET /api/mood-journal — Get mood entries for the last N days
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
    const days = parseInt(searchParams.get('days') ?? '7', 10);
    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: entries, error } = await supabase
      .from('mood_journal')
      .select('id, mood_type, intensity, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching mood journal:', error);
      return new NextResponse(error.message, { status: 500 });
    }

    return NextResponse.json({ entries: entries ?? [] });
  } catch (error) {
    console.error('Error fetching mood journal:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
