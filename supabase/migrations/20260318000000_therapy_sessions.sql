-- Therapy session history tables
-- Stores session metadata and conversation messages for continuity

create table if not exists public.therapy_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.therapy_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  timestamp bigint not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_therapy_sessions_user_id on public.therapy_sessions(user_id);
create index idx_therapy_sessions_started_at on public.therapy_sessions(started_at desc);
create index idx_session_messages_session_id on public.session_messages(session_id);
create index idx_session_messages_timestamp on public.session_messages(timestamp);

-- Row Level Security
alter table public.therapy_sessions enable row level security;
alter table public.session_messages enable row level security;

-- Users can only access their own sessions
create policy "Users can view own sessions"
  on public.therapy_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.therapy_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.therapy_sessions for update
  using (auth.uid() = user_id);

-- Users can access messages for their own sessions
create policy "Users can view own session messages"
  on public.session_messages for select
  using (
    exists (
      select 1 from public.therapy_sessions
      where therapy_sessions.id = session_messages.session_id
        and therapy_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own session messages"
  on public.session_messages for insert
  with check (
    exists (
      select 1 from public.therapy_sessions
      where therapy_sessions.id = session_messages.session_id
        and therapy_sessions.user_id = auth.uid()
    )
  );
