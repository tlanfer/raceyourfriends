# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Race Your Friends is a real-time GPS racing app where players compete by physically moving (running/walking/biking). Players join a room via 4-character codes, and once a race starts, the app tracks each player's GPS distance toward a shared target distance. Built with SvelteKit + WebSocket server + WebRTC for peer-to-peer updates.

## Commands

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Production build (Node adapter)
- `npm run preview` / `npm start` — Run production server via `server.js`
- `npm run check` — Type-check with svelte-check
- `npm run test` — Run tests with vitest
- `npm run test:watch` — Run tests in watch mode
- `npm run build:cap` — Build for Capacitor (static adapter, outputs to `build-static/`)
- `npm run cap:sync` — Build + sync Capacitor native projects

## Architecture

### Dual build targets
`svelte.config.js` switches adapters based on `SVELTE_CONFIG` env var:
- Default: `adapter-node` for web deployment (SSR + WebSocket server)
- `SVELTE_CONFIG=capacitor`: `adapter-static` outputting to `build-static/` for native apps

### Server-side (Node.js)
- **`server.js`** — Production entry point. Creates HTTP server from SvelteKit's built handler, then attaches WebSocket server.
- **`src/lib/server/ws.ts`** — WebSocket server handling all signaling: room management, race lifecycle (create/join/ready/countdown/start/finish), RTC signaling relay, chat, emotes, and distance broadcasting. Listens on `/ws` path only.
- **`src/lib/server/race-rooms.ts`** — In-memory room state management.

### Client-side
- **`src/lib/stores/race.svelte.ts`** — Central reactive state using Svelte 5 runes (`$state`). Single `RaceState` class exported as singleton. Manages race phase transitions: `setup → lobby → countdown → racing → finished`.
- **`src/lib/webrtc/`** — WebRTC layer for peer-to-peer distance updates:
  - `signaling.ts` — WebSocket client (singleton). On native platforms, uses `VITE_WS_URL` env var; on web, derives URL from `location`.
  - `peer-manager.ts` — Manages RTCPeerConnection mesh. Uses lexicographic ID ordering to determine which peer initiates offers.
  - `data-channel.ts` — Broadcasts distance updates every 1s over WebRTC data channels (with WebSocket fallback).
- **`src/lib/geo/`** — GPS tracking:
  - `tracker.ts` — `GeoTracker` class with jitter filtering (accuracy threshold 20m, min delta 1m, max speed 50km/h). Uses `navigator.geolocation` on web, `@capgo/background-geolocation` on native via Capacitor platform detection.
  - `distance.ts` — Haversine formula for GPS distance calculation.

### Routes
- `/` — Home page: name input + race setup (create/join)
- `/race/[code]` — Main race page with phase-based rendering (Lobby → Countdown → RaceView → FinishLine)
- `/join/[code]` — Join via link
- `/demo` — Demo page

### Key patterns
- Svelte 5 runes mode is enforced for all non-node_modules files via `vitePlugin.dynamicCompileOptions`
- Race codes use a restricted character set (no ambiguous chars like 0/O, I/1/L) — see `src/lib/utils/race-code.ts`
- Distance updates use dual transport: WebRTC peer-to-peer (primary) + WebSocket (fallback), both at 1s intervals
- Native platform features (background GPS, keep-awake) are conditionally loaded via `Capacitor.isNativePlatform()`

## Environment Variables

- `VITE_WS_URL` — WebSocket server URL for native Capacitor builds (see `.env.example`)
- `PORT` — Server port (default 3000)
- `SVELTE_CONFIG=capacitor` — Switches to static adapter for native builds
