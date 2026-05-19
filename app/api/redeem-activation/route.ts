import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { code } = (await request.json().catch(() => ({}))) as { code?: string };

  const trimmed = code?.trim().toUpperCase();
  if (!trimmed) {
    return NextResponse.json({ ok: false, reason: 'missing_code' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'not_authenticated' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('redeem_activation_code', { p_code: trimmed });

  if (error) {
    return NextResponse.json({ ok: false, reason: 'rpc_error', message: error.message }, { status: 500 });
  }

  const result = data as { ok: boolean; reason?: string };
  if (!result?.ok) {
    return NextResponse.json(result ?? { ok: false, reason: 'unknown' }, { status: 400 });
  }
  return NextResponse.json(result);
}
