# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **reference frontend** for Theraverse, a real-time mental health support AI chatbot with video avatar. It's a Next.js 15 app that connects to a Python backend agent via LiveKit Cloud (WebRTC/WebSocket). The `migration-react-to-next` branch is using this as the source of truth while migrating to `theraverse-next/` (Next.js 16).

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server with Turbopack on port 3000
pnpm build            # Production build (standalone output)
pnpm lint             # ESLint
pnpm format           # Prettier format all files
pnpm format:check     # Check formatting without writing
```

Copy `.env.example` to `.env.local` and fill in `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`. Optional auth: `AUTH_USERNAME`, `AUTH_PASSWORD`.

## Architecture

### Data Flow

```
User opens app → Page (server component) loads AppConfig → App (client component) renders
  → Welcome screen shown → User clicks "Start Conversation"
  → useConnectionDetails fetches /api/connection-details (generates LiveKit access token)
  → Room.connect(serverUrl, participantToken) establishes WebRTC connection
  → SessionView renders with live audio/video/chat from the backend agent
  → On disconnect, connectionDetails are refreshed for next session
```

### Two-Layer Component Architecture

**Server components** (`app/` directory): The page at `app/(app)/page.tsx` is a server component that reads `AppConfig` via `getAppConfig()` (which supports remote sandbox config or falls back to `app-config.ts` defaults). The root layout at `app/layout.tsx` injects accent colors as CSS custom properties.

**Client components** (`components/` directory): All interactive UI is client-side. The entry point is `components/app.tsx` which owns the `Room` instance and session lifecycle. It renders either `Welcome` (pre-session) or `SessionView` (active session) with crossfade animations via `motion`.

### Key Modules

- **`app/api/connection-details/route.ts`** — Generates a LiveKit access token with a random room name and participant identity. This is the only API route needed for the agent connection.
- **`middleware.ts`** — HTTP Basic auth gate. Protects all routes except `/api/auth` and Next.js internals.
- **`app-config.ts`** — Branding and feature flags (`AppConfig` type in `lib/types.ts`). Controls chat input, video input, screen share, pre-connect buffer, logo, accent colors, and button text.
- **`hooks/useChatAndTranscription.ts`** — Merges LiveKit transcriptions (from `useTranscriptions`) with chat messages (from `useChat`) into a single sorted message list.
- **`hooks/useConnectionDetails.ts`** — Fetches and caches connection details. Supports custom endpoint via `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT`.
- **`components/livekit/media-tiles.tsx`** — Manages the visual layout of agent tile (audio visualizer or avatar video), camera, and screen share tiles. Uses a CSS grid with different layout states based on chat open/closed.
- **`components/livekit/agent-control-bar/`** — Control bar with mic/camera/screen share toggles, device selection, chat input, and disconnect button.

### LiveKit Integration Pattern

The app creates a single `Room` instance via `useMemo(() => new Room(), [])` in `App`. This room is provided to all children via `RoomContext.Provider`. Components use LiveKit React hooks (`useVoiceAssistant`, `useTranscriptions`, `useChat`, `useTracks`, etc.) to interact with the room. The agent's audio/video tracks are accessed through `useVoiceAssistant()` which returns `state`, `audioTrack`, and `videoTrack`.

When `videoTrack` is present, the agent renders as an avatar (`AvatarTile`); otherwise it renders as an audio visualizer (`AgentTile`).

## Conventions

- **Path aliases**: `@/*` maps to project root (e.g., `@/components/app`, `@/lib/utils`)
- **Styling**: Tailwind CSS v4 with `cn()` utility (clsx + tailwind-merge). Dark theme is hardcoded (`class="dark"` on html element). Accent color flows through `--primary` CSS variable.
- **Animations**: `motion` (Framer Motion) for transitions. Components are wrapped with `motion.create()` for layout animations.
- **Icons**: `@phosphor-icons/react` (SSR imports from `dist/ssr`)
- **UI primitives**: Radix UI (`@radix-ui/react-*`) for accessible select, toggle, and other components
- **Build config**: `next.config.ts` has `output: 'standalone'` for Docker deployment. ESLint and TypeScript errors are ignored during builds.
