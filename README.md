# Race Your Friends

A real-time GPS racing app where players compete by physically moving. Players join a room via 4-character codes, and the app tracks each player's GPS distance toward a shared target distance. Built with SvelteKit, WebSockets, and WebRTC for peer-to-peer updates.

## Getting started

```sh
npm install
npm run dev
```

This starts the Vite dev server with the WebSocket signaling server attached. Open the app in your browser and create or join a race.

## Building

The app builds as static files:

```sh
npm run build
```

Output goes to `build-static/`. Serve these files with any static file server (Nginx, Caddy, S3, etc.).

## Standalone server

The WebSocket signaling server lives in `server/` and can be deployed independently:

```sh
cd server
npm install
npm run build
npm start
```

### Docker

```sh
docker build -t raceyourfriends-server server/
docker run -p 3000:3000 raceyourfriends-server
```

See `docker-compose.example.yml` for a compose setup.

The server is automatically built and published to `ghcr.io/tlanfer/raceyourfriends-server` on push to `main`.

## Native apps (Capacitor)

```sh
npm run cap:sync
```

Set `VITE_WS_URL` to point to your deployed signaling server (see `.env.example`).

## Testing

```sh
npm run test        # run once
npm run test:watch  # watch mode
npm run check       # type-check
```
