import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

/**
 * GET /api/hume-key — Returns the Hume API key for authenticated users
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

    const apiKey = process.env.HUME_API_KEY;
    if (!apiKey) {
      return new NextResponse('Hume API key not configured', { status: 500 });
    }

    return NextResponse.json({ apiKey });
  } catch {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
