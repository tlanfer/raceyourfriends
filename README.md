# Race Your Friends

A real-time GPS racing app where you compete against friends by physically running, walking, or biking. Set a target distance, share a code, and race — wherever you are.

## What is it?

Race Your Friends lets you have real races with friends without needing to be in the same place. Everyone races the same distance, and the app tracks your GPS movement in real time so you can see each other's progress live.

It works on the web and as a native app on iOS and Android.

## How it works

### 1. Create a race

Enter your name, give the race a name, and pick a distance — from 1 km to 20 km, or set a custom distance. Then choose a race mode:

- **Live Race** — Everyone races at the same time. A countdown syncs the start, and you watch each other's progress in real time.
- **Ghost Race** — Players run the same distance on their own schedule over 1–7 days. You race against recordings of previous runners, so you don't all need to be available at once.

### 2. Share the code

Each race gets a 4-character code. Share it with friends so they can join, or copy the join link directly.

### 3. Race

Once everyone is in the lobby and has a GPS signal, ready up and go. The app tracks your distance using GPS and shows everyone's progress toward the finish line. Your screen stays awake during the race so you can glance at it while moving.

### 4. Finish

Cross the target distance to finish. See the final results and how everyone placed.

## Features

- **Real-time progress** — See how far along every racer is as the race happens
- **Live and ghost modes** — Race together in real time, or on your own schedule
- **Chat and emotes** — Send messages and reactions in the lobby and during the race
- **Works anywhere** — Race from different cities, countries, or continents
- **No account needed** — Just pick a name and go
- **Preset and custom distances** — 1 km, 2 km, 5 km, 10 km, 15 km, 20 km, or any custom distance
- **GPS jitter filtering** — Smart filtering for accurate distance tracking
- **Works on web, iOS, and Android**

## Self-hosting

Race Your Friends can be self-hosted. The server is published as a Docker image:

```sh
docker run -p 3000:3000 ghcr.io/tlanfer/raceyourfriends-server
```

See the [server/](server/) directory for more details.
