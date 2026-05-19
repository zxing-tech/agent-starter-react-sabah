-- Mood journal for daily mood check-ins without starting a session
create table if not exists public.mood_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_type text not null,
  intensity integer not null check (intensity >= 0 and intensity <= 10),
  created_at timestamptz not null default now()
);

create index idx_mood_journal_user_id on public.mood_journal(user_id);
create index idx_mood_journal_created_at on public.mood_journal(created_at desc);

alter table public.mood_journal enable row level security;

create policy "Users can view own mood entries"
  on public.mood_journal for select
  using (auth.uid() = user_id);

create policy "Users can insert own mood entries"
  on public.mood_journal for insert
  with check (auth.uid() = user_id);
