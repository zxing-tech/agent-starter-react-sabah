# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Healthier Sabah** frontend — a real-time mental health support app with a video avatar AI companion. It is a Next.js 16 + React 19 app, derived from the LiveKit `agent-starter-react` template, that connects to a Python backend agent via LiveKit Cloud (WebRTC/WebSocket) and persists session state to Supabase. This repo is the source-of-truth frontend; a parallel migration to `theraverse-next/` may consume from it.

## Development Commands

```bash
pnpm install          # Install dependencies (pnpm 9.15.9, pinned in packageManager)
pnpm dev              # Dev server with Turbopack on port 3026
pnpm build            # Production build (standalone output for Docker)
pnpm start            # Run the built standalone server
pnpm lint             # ESLint (next/core-web-vitals + import + prettier)
pnpm format           # Prettier write
pnpm format:check     # Prettier check
```

There is no test runner configured.

`next.config.ts` sets `typescript.ignoreBuildErrors: true` — `pnpm build` will succeed despite TS errors. Use `pnpm lint` or a one-off `pnpm exec tsc --noEmit` to actually surface type issues.

### Environment

Copy `.env.example` to `.env.local`. Required:

- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` — LiveKit Cloud project credentials.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project (currently `lwhfjwkfkvmaqblyphij`, shared with theraverse). These are inlined at build time.
- `HUME_API_KEY` — server-side Hume key, returned to authenticated clients via `/api/hume-key` for browser-side emotion detection.

Optional: `NEXT_PUBLIC_APP_CONFIG_ENDPOINT` + `SANDBOX_ID` to fetch `AppConfig` from a remote LiveKit Sandbox; otherwise defaults from `app-config.ts` are used.

### Docker

`docker-compose.yml` builds and runs the container on port 3026. Supabase URL/anon key are passed as build args (because of `NEXT_PUBLIC_` inlining) and as runtime env. LiveKit secrets are runtime-only.

### Supabase

Local SQL lives in `supabase/migrations/`. Three tables back the app:

- `therapy_sessions` — one row per completed session, with `cbt_data` JSONB column (mood ratings, CBT insights, homework, optional emotion snapshots).
- `session_messages` — chat/transcript messages per session.
- `mood_journal` — daily mood check-ins independent of sessions.

All tables use RLS with `auth.uid() = user_id` policies. Activation codes are redeemed via a Supabase RPC `redeem_activation_code` (defined server-side, not in this repo).

## Architecture

### Auth & route groups

Auth is handled by Supabase via `@supabase/ssr` cookies, not HTTP Basic. `middleware.ts` calls `lib/supabase/middleware.ts:updateSession`, which:

1. Refreshes the Supabase token on every request (`getUser()` triggers refresh).
2. Redirects unauthenticated users to `/login` (except `/login`, `/signup`, `/register`, `/verify-email`, `/forgot-password`, `/privacy`, `/terms`).
3. Redirects authenticated users away from auth pages back to `/`.
4. Honors a `remember_me=1` cookie to extend cookie maxAge to 30 days.

Email confirmation callbacks (`/auth/confirm`, `/auth/callback`) and static assets are excluded by the middleware matcher.

The `app/` directory is split into route groups:

- `(app)/` — authenticated app shell (header with Home / Progress / History / SignOut). Contains the main `page.tsx`, `progress/`, and `history/`.
- `(auth)/` — login, signup, register, verify-email, forgot/reset password, SSO consent.
- `(legal)/` — privacy and terms (public).
- `components/` (under `app/`) — a demo/showcase page for the LiveKit primitives at `/components`; not part of the user-facing flow.

### Session lifecycle

The home page is a server component that loads `AppConfig` via `getAppConfig()` (which prefers a remote sandbox config when `CONFIG_ENDPOINT` is set, otherwise falls back to `app-config.ts`). It renders the `<App>` client component.

`components/app.tsx` owns the `Room` instance (`useMemo(() => new Room(), [])`) and the session state machine:

```
Welcome (dashboard with streak, mood journal, homework, progress, recent sessions)
  → "Start Conversation" → ActivationGate (POST /api/redeem-activation)
  → EnvironmentCheck wizard (mic/camera permissions)
  → setSessionStarted(true)
  → useConnectionDetails fetches GET /api/connection-details
       — requires Supabase auth; embeds recent-session context + homework
         reminder into the LiveKit token's `metadata`
  → Room.connect(serverUrl, participantToken)
  → SessionView renders
  → On RoomEvent.Disconnected, saveSession() POSTs to /api/sessions
    and connection details are refreshed for the next call
```

`SessionView` enforces a hard cap of `MAX_SESSION_SECONDS = 30 * 60` (30 minutes) and auto-disconnects when it elapses. It also disconnects after 30s if the agent never reaches `listening`/`thinking`/`speaking`.

### LiveKit data channel topics

The agent and the client communicate structured side-channel data via `Room.localParticipant.publishData(...)` + `RoomEvent.DataReceived`, keyed by `topic`:

- `cbt_data` (agent → client, in `components/app.tsx`) — `{ mood_ratings, insights, homework }` from the CBT module. Stored in `cbtDataRef` and persisted on disconnect.
- `emotion_visual` (client → agent, in `hooks/useEmotionDetection.ts`) — top-3 facial emotions from Hume. Also mirrored into `emotionSnapshotsRef` (capped at 100 samples) so it can be merged into `cbt_data.emotions` when saving.
- `crisis_alert` (agent → client, in `components/session-view.tsx`) — `{ crisis: true, reason, contacts[] }`, surfaced as a red emergency banner with tel: links.

When extending the agent, follow this pattern: pick a topic string, JSON-encode the payload, and register a `DataReceived` listener that filters on `topic`.

### Recent-session continuity

`app/api/connection-details/route.ts` is not just a token generator. Before minting the LiveKit token it queries the last 3 `therapy_sessions` (with `cbt_data`) plus their tail messages, builds a `sessionContext` string (mood trajectory, identified distortions, homework, recent dialogue), and attaches it as the LiveKit participant `metadata`. The backend agent reads that metadata to maintain continuity across sessions. If you change the CBT schema, update both the persistence path (`useSessionPersistence` / `/api/sessions`) and the summarization in `connection-details/route.ts`.

### Emotion detection (Hume)

`hooks/useEmotionDetection.ts` opens a **direct browser WebSocket to `wss://api.hume.ai/v0/stream/models`** using the API key fetched from `/api/hume-key`. It captures a 320×240 JPEG every 4s from a separate `getUserMedia` stream (not the LiveKit camera track), POSTs frames over the WS, and republishes the simplified top-N emotions to the agent via LiveKit. The map in `EMOTION_SIMPLIFY` normalizes Hume's labels for the agent and indicator UI.

### i18n

Custom lightweight i18n in `lib/i18n/`:

- Locales: `en`, `ms`, `zh`, `ta` (`lib/i18n/config.ts`).
- Active locale is read from a `locale` cookie (`LOCALE_COOKIE`) via `getLocale()`.
- `messages/{locale}.json` are dot-path JSON dictionaries; lookup via `t(messages, key, params)` for server components, or `useTranslations()` from `lib/i18n/client.tsx` in client components.
- `lib/i18n/actions.ts` exposes server actions to switch locales.

When adding strings, edit all four JSON files in lockstep — there is no fallback per-key (only per-file).

## Conventions

- **Path aliases**: `@/*` maps to project root (e.g., `@/components/app`, `@/lib/utils`).
- **Styling**: Tailwind CSS v4 + `cn()` from `lib/utils.ts` (clsx + tailwind-merge). Dark theme is hardcoded (`class="dark"` on `<html>` in `app/layout.tsx`). Accent color flows via the `--primary` CSS variable, set inline from `AppConfig.accent`/`accentDark`. Body background is hardcoded to `#0B1A2B` (Sabah navy).
- **Branding**: Sabah flag palette — primary teal `#1A8A8A` / dark `#47C4CF`. Buttons and gradients use these directly; the wordmark "Healthier Sabah" is text in `app/(app)/layout.tsx`, not an SVG.
- **Animations**: `motion` (Framer Motion v12). Components wrapped with `motion.create()` for layout/crossfade.
- **Icons**: `@phosphor-icons/react` (SSR imports from `dist/ssr`); listed in `experimental.optimizePackageImports` in `next.config.ts`.
- **UI primitives**: Radix UI (`@radix-ui/react-*`) for select, toggle, scroll-area, etc.
- **Prettier import order** (`.prettierrc`): `react` → `next` → `next/*` → third-party → `@scope/*` → `@/*` → relative. Sort is enforced by `@trivago/prettier-plugin-sort-imports`; tailwind classes are sorted by `prettier-plugin-tailwindcss`.
- **Build**: `next.config.ts` sets `output: 'standalone'` (for the Docker `runner` stage) and `typescript.ignoreBuildErrors: true`.
