import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import {
	createRoom,
	getRoom,
	setRoom,
	addPlayerToRoom,
	removePlayerFromRoom,
	addSpectatorToRoom,
	removeSpectatorFromRoom,
	broadcastToRoom,
	getPlayerList,
	addMessage,
	setGhostRoomCleanupHandler,
	type RaceRoom,
	type ChatMessage,
	type ActiveGhostRun
} from './race-rooms.js';
import { generateRaceCode } from './race-code.js';
import {
	ensureDataDir,
	loadGhostRace,
	saveGhostRace,
	deleteGhostRace,
	type GhostRaceFile
} from './ghost-storage.js';

interface ClientState {
	id: string;
	roomCode: string | null;
	isSpectator: boolean;
}

const clients = new WeakMap<WebSocket, ClientState>();

function send(ws: WebSocket, msg: object): void {
	if (ws.readyState === 1) {
		ws.send(JSON.stringify(msg));
	}
}

function generateId(): string {
	return Math.random().toString(36).slice(2, 10);
}

function startBroadcastTimer(room: RaceRoom): void {
	room.broadcastTimer = setInterval(() => {
		const players = Array.from(room.players.keys()).map((id) => ({
			id,
			distance: room.distances.get(id) ?? 0,
			finished: room.finishedPlayers.has(id)
		}));
		broadcastToRoom(room, { type: 'race-distances', players });
	}, 5000);
}

export function setupWebSocketServer(server: Server): WebSocketServer {
	ensureDataDir();
	setGhostRoomCleanupHandler((code) => deleteGhostRace(code));

	const wss = new WebSocketServer({ noServer: true });

	// Only handle upgrade requests on our /ws path
	server.on('upgrade', (req, socket, head) => {
		const pathname = new URL(req.url || '/', `http://${req.headers.host}`).pathname;
		if (pathname === '/ws') {
			wss.handleUpgrade(req, socket, head, (ws) => {
				wss.emit('connection', ws, req);
			});
		}
	});

	wss.on('connection', (ws: WebSocket) => {
		const clientId = generateId();
		const state: ClientState = { id: clientId, roomCode: null, isSpectator: false };
		clients.set(ws, state);

		send(ws, { type: 'connected', id: clientId });

		ws.on('message', (raw: Buffer | string) => {
			try {
				const msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
				handleMessage(ws, state, msg);
			} catch {
				// Ignore malformed messages
			}
		});

		ws.on('close', () => {
			handleDisconnect(ws, state);
		});
	});

	return wss;
}

function handleMessage(ws: WebSocket, state: ClientState, msg: any): void {
	switch (msg.type) {
		case 'create-race':
			handleCreateRace(ws, state, msg);
			break;
		case 'join-race':
			handleJoinRace(ws, state, msg);
			break;
		case 'watch-race':
			handleWatchRace(ws, state, msg);
			break;
		case 'ready':
			handleReady(ws, state, msg);
			break;
		case 'start-race':
			handleStartRace(ws, state);
			break;
		case 'cancel-countdown':
			handleCancelCountdown(ws, state);
			break;
		case 'chat-message':
			handleChatMessage(ws, state, msg);
			break;
		case 'emote':
			handleEmote(ws, state, msg);
			break;
		case 'distance':
			handleDistance(ws, state, msg);
			break;
		case 'finished':
			handleFinished(ws, state, msg);
			break;
		case 'create-ghost-race':
			handleCreateGhostRace(ws, state, msg);
			break;
		case 'join-ghost-race':
			handleJoinGhostRace(ws, state, msg);
			break;
		case 'ghost-start-run':
			handleGhostStartRun(ws, state);
			break;
		case 'ghost-distance':
			handleGhostDistance(ws, state, msg);
			break;
		case 'ghost-finished':
			handleGhostFinished(ws, state, msg);
			break;
	}
}

function handleCreateRace(ws: WebSocket, state: ClientState, msg: any): void {
	const code = generateRaceCode();
	const targetDistance = Number(msg.targetDistance) || 500;
	const raceName = msg.raceName || 'Unnamed Race';
	const room = createRoom(code, raceName, state.id, targetDistance);
	state.roomCode = code;

	addPlayerToRoom(room, {
		id: state.id,
		name: msg.name || 'Unknown',
		ready: false,
		ws
	});

	send(ws, {
		type: 'race-created',
		code,
		raceName: room.name,
		targetDistance: room.targetDistance,
		players: getPlayerList(room)
	});
}

function handleJoinRace(ws: WebSocket, state: ClientState, msg: any): void {
	const code = (msg.code || '').toUpperCase();
	let room: RaceRoom | undefined | null = getRoom(code);

	// Try restoring ghost race from disk
	if (!room) {
		room = restoreGhostRoomFromDisk(code);
	}

	if (!room) {
		send(ws, { type: 'error', message: 'Race not found' });
		return;
	}

	// If it's a ghost race, redirect to ghost join handler
	if (room.mode === 'ghost') {
		handleJoinGhostRace(ws, state, msg);
		return;
	}

	if (room.phase !== 'lobby') {
		send(ws, { type: 'error', message: 'Race already started' });
		return;
	}

	state.roomCode = code;

	addPlayerToRoom(room, {
		id: state.id,
		name: msg.name || 'Unknown',
		ready: false,
		ws
	});

	send(ws, {
		type: 'race-joined',
		code,
		raceName: room.name,
		targetDistance: room.targetDistance,
		ownerId: room.ownerId,
		players: getPlayerList(room),
		messages: room.messages
	});

	broadcastToRoom(room, {
		type: 'player-joined',
		player: { id: state.id, name: msg.name || 'Unknown', ready: false },
		players: getPlayerList(room)
	}, state.id);
}

function handleWatchRace(ws: WebSocket, state: ClientState, msg: any): void {
	const code = (msg.code || '').toUpperCase();
	const room = getRoom(code);

	if (!room) {
		send(ws, { type: 'error', message: 'Race not found' });
		return;
	}

	state.roomCode = code;
	state.isSpectator = true;

	addSpectatorToRoom(room, { id: state.id, ws });

	// Build current distance info for players
	const playersWithDistance = Array.from(room.players.keys()).map((id) => ({
		id,
		distance: room.distances.get(id) ?? 0,
		finished: room.finishedPlayers.has(id)
	}));

	send(ws, {
		type: 'race-watched',
		code,
		raceName: room.name,
		targetDistance: room.targetDistance,
		ownerId: room.ownerId,
		phase: room.phase,
		startTime: room.startTime,
		players: getPlayerList(room),
		distances: playersWithDistance,
		messages: room.messages
	});
}

function handleReady(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	const player = room.players.get(state.id);
	if (player) {
		player.ready = msg.ready !== false;
	}

	broadcastToRoom(room, {
		type: 'player-ready',
		playerId: state.id,
		ready: player?.ready ?? false,
		players: getPlayerList(room)
	});
}

function handleStartRace(ws: WebSocket, state: ClientState): void {
	if (!state.roomCode) { console.log('[start-race] no roomCode'); return; }
	const room = getRoom(state.roomCode);
	if (!room) { console.log('[start-race] room not found'); return; }

	if (state.id !== room.ownerId) { console.log('[start-race] not owner:', state.id, '!=', room.ownerId); return; }

	if (room.players.size < 2) { console.log('[start-race] not enough players:', room.players.size); return; }

	console.log('[start-race] starting countdown for room', room.code);

	const startTime = Date.now() + 10_000;
	room.phase = 'countdown';
	room.startTime = startTime;
	broadcastToRoom(room, { type: 'countdown-start', startTime });

	room.countdownTimer = setTimeout(() => {
		room.countdownTimer = null;
		room.phase = 'racing';
		broadcastToRoom(room, { type: 'race-started' });
		startBroadcastTimer(room);
	}, 10_000);
}

function handleCancelCountdown(ws: WebSocket, state: ClientState): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;
	if (state.id !== room.ownerId) return;
	if (room.phase !== 'countdown') return;

	if (room.countdownTimer) {
		clearTimeout(room.countdownTimer);
		room.countdownTimer = null;
	}
	room.startTime = null;
	room.phase = 'lobby';
	broadcastToRoom(room, { type: 'countdown-cancelled' });
}

function handleDistance(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room || room.phase !== 'racing') return;

	room.distances.set(state.id, msg.distance);
}

function handleFinished(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	room.finishedPlayers.add(state.id);
	room.distances.set(state.id, msg.distance ?? room.distances.get(state.id) ?? 0);

	broadcastToRoom(room, {
		type: 'player-finished',
		playerId: state.id
	}, state.id);
}

// --- Ghost race handlers ---

function buildGhostRaceFile(room: RaceRoom): GhostRaceFile {
	return {
		code: room.code,
		name: room.name,
		targetDistance: room.targetDistance,
		createdAt: room.createdAt,
		expiresAt: room.expiresAt!,
		runs: room.completedRuns
	};
}

// Throttle saves per room: at most once per 30s
const lastSaveTimes = new Map<string, number>();

function throttledSaveGhostRace(room: RaceRoom): void {
	const now = Date.now();
	const last = lastSaveTimes.get(room.code) ?? 0;
	if (now - last < 30_000) return;
	lastSaveTimes.set(room.code, now);

	// Include in-progress active runs in the file for crash recovery
	const file = buildGhostRaceFile(room);
	if (room.activeRuns) {
		for (const run of room.activeRuns.values()) {
			file.runs.push({
				runnerId: run.runnerId,
				runnerName: run.runnerName,
				samples: [...run.samples],
				startedAt: run.personalStartTime,
				finishedAt: null,
				finalDistance: run.samples.length > 0 ? run.samples[run.samples.length - 1].distance : 0
			});
		}
	}
	saveGhostRace(room.code, file);
}

function restoreGhostRoomFromDisk(code: string): RaceRoom | null {
	const file = loadGhostRace(code);
	if (!file) return null;

	const room: RaceRoom = {
		code: file.code,
		name: file.name,
		ownerId: '',
		targetDistance: file.targetDistance,
		players: new Map(),
		spectators: new Map(),
		phase: 'lobby',
		countdownTimer: null,
		broadcastTimer: null,
		startTime: null,
		distances: new Map(),
		finishedPlayers: new Set(),
		createdAt: file.createdAt,
		messages: [],
		mode: 'ghost',
		expiresAt: file.expiresAt,
		completedRuns: file.runs,
		activeRuns: new Map()
	};
	setRoom(code, room);
	return room;
}

function handleCreateGhostRace(ws: WebSocket, state: ClientState, msg: any): void {
	const code = generateRaceCode();
	const targetDistance = Number(msg.targetDistance) || 500;
	const raceName = msg.raceName || 'Unnamed Race';
	const durationDays = Math.min(7, Math.max(1, Number(msg.durationDays) || 1));
	const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;

	const room = createRoom(code, raceName, state.id, targetDistance, 'ghost', expiresAt);
	state.roomCode = code;

	addPlayerToRoom(room, {
		id: state.id,
		name: msg.name || 'Unknown',
		ready: false,
		ws
	});

	// Save initial file
	saveGhostRace(code, buildGhostRaceFile(room));

	send(ws, {
		type: 'ghost-race-created',
		code,
		raceName: room.name,
		targetDistance: room.targetDistance,
		expiresAt
	});
}

function handleJoinGhostRace(ws: WebSocket, state: ClientState, msg: any): void {
	const code = (msg.code || '').toUpperCase();
	let room: RaceRoom | undefined | null = getRoom(code);

	// Try to restore from disk if not in memory
	if (!room) {
		room = restoreGhostRoomFromDisk(code);
	}

	if (!room || room.mode !== 'ghost') {
		send(ws, { type: 'error', message: 'Ghost race not found' });
		return;
	}

	state.roomCode = code;

	addPlayerToRoom(room, {
		id: state.id,
		name: msg.name || 'Unknown',
		ready: false,
		ws
	});

	const expired = room.expiresAt != null && Date.now() > room.expiresAt;

	// Build run summaries for lobby
	const runs = room.completedRuns.map((r) => ({
		runnerId: r.runnerId,
		runnerName: r.runnerName,
		finalDistance: r.finalDistance,
		finishedAt: r.finishedAt,
		startedAt: r.startedAt
	}));

	const activeRunners = room.activeRuns
		? Array.from(room.activeRuns.values()).map((r) => ({
				runnerId: r.runnerId,
				runnerName: r.runnerName
			}))
		: [];

	send(ws, {
		type: 'ghost-race-joined',
		code,
		raceName: room.name,
		targetDistance: room.targetDistance,
		expiresAt: room.expiresAt,
		runs,
		activeRunners,
		expired,
		messages: room.messages
	});

	broadcastToRoom(
		room,
		{
			type: 'player-joined',
			player: { id: state.id, name: msg.name || 'Unknown', ready: false },
			players: getPlayerList(room)
		},
		state.id
	);
}

function handleGhostStartRun(ws: WebSocket, state: ClientState): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room || room.mode !== 'ghost') return;

	// Reject if expired
	if (room.expiresAt != null && Date.now() > room.expiresAt) {
		send(ws, { type: 'error', message: 'This ghost race has expired' });
		return;
	}

	if (!room.activeRuns) room.activeRuns = new Map();

	const player = room.players.get(state.id);
	if (!player) return;

	const startTime = Date.now() + 10_000; // 10s countdown

	const activeRun: ActiveGhostRun = {
		runnerId: state.id,
		runnerName: player.name,
		samples: [],
		personalStartTime: startTime,
		broadcastTimer: null
	};
	room.activeRuns.set(state.id, activeRun);

	// Send countdown
	send(ws, { type: 'ghost-countdown-start', startTime });

	// Notify others that someone is starting
	broadcastToRoom(
		room,
		{
			type: 'ghost-runner-starting',
			runnerId: state.id,
			runnerName: player.name
		},
		state.id
	);

	// After countdown, send ghost data and start broadcast timer
	room.countdownTimer = setTimeout(() => {
		// Gather all ghost data: completed runs + in-progress active runs
		const ghostRuns = room.completedRuns.map((r) => ({
			runnerId: r.runnerId,
			runnerName: r.runnerName,
			samples: r.samples
		}));

		// Add currently active runs (other runners)
		if (room.activeRuns) {
			for (const [id, run] of room.activeRuns) {
				if (id !== state.id) {
					ghostRuns.push({
						runnerId: run.runnerId,
						runnerName: run.runnerName,
						samples: [...run.samples]
					});
				}
			}
		}

		send(ws, { type: 'ghost-race-started', ghostRuns });

		// Start personal broadcast timer (5s) to forward samples to this runner
		activeRun.broadcastTimer = setInterval(() => {
			if (!room.activeRuns) return;
			const runners = Array.from(room.activeRuns.entries())
				.filter(([id]) => id !== state.id)
				.map(([id, r]) => ({
					id,
					distance: r.samples.length > 0 ? r.samples[r.samples.length - 1].distance : 0,
					name: r.runnerName
				}));
			if (runners.length > 0) {
				send(ws, { type: 'ghost-run-distances', players: runners });
			}
		}, 5000);
	}, 10_000);
}

function handleGhostDistance(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room || room.mode !== 'ghost' || !room.activeRuns) return;

	const activeRun = room.activeRuns.get(state.id);
	if (!activeRun) return;

	const sample = {
		elapsed_ms: Number(msg.elapsed_ms) || 0,
		distance: Number(msg.distance) || 0
	};
	activeRun.samples.push(sample);

	// Forward to other active runners as live ghost update
	if (room.activeRuns) {
		for (const [id, otherRun] of room.activeRuns) {
			if (id !== state.id) {
				const otherPlayer = room.players.get(id);
				if (otherPlayer && otherPlayer.ws.readyState === 1) {
					otherPlayer.ws.send(
						JSON.stringify({
							type: 'ghost-run-sample',
							runnerId: state.id,
							elapsed_ms: sample.elapsed_ms,
							distance: sample.distance
						})
					);
				}
			}
		}
	}

	// Throttled save
	throttledSaveGhostRace(room);
}

function handleGhostFinished(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room || room.mode !== 'ghost' || !room.activeRuns) return;

	const activeRun = room.activeRuns.get(state.id);
	if (!activeRun) return;

	// Clean up broadcast timer
	if (activeRun.broadcastTimer) clearInterval(activeRun.broadcastTimer);

	const completedRun = {
		runnerId: activeRun.runnerId,
		runnerName: activeRun.runnerName,
		samples: activeRun.samples,
		startedAt: activeRun.personalStartTime,
		finishedAt: Date.now(),
		finalDistance: Number(msg.distance) || (activeRun.samples.length > 0 ? activeRun.samples[activeRun.samples.length - 1].distance : 0)
	};

	room.completedRuns.push(completedRun);
	room.activeRuns.delete(state.id);

	// Save to disk immediately
	lastSaveTimes.delete(room.code);
	saveGhostRace(room.code, buildGhostRaceFile(room));

	// Broadcast to all connected
	broadcastToRoom(room, {
		type: 'ghost-run-complete',
		run: {
			runnerId: completedRun.runnerId,
			runnerName: completedRun.runnerName,
			finalDistance: completedRun.finalDistance,
			finishedAt: completedRun.finishedAt,
			startedAt: completedRun.startedAt
		}
	});
}

const ALLOWED_EMOTES = new Set(['\u{1F3C3}', '\u{1F4A8}', '\u{1F525}', '\u{1F624}', '\u{1F480}', '\u{1F975}', '\u{1F602}', '\u{1F44B}', '\u{1F4AA}', '\u{1F3C6}']);

function handleChatMessage(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	const text = typeof msg.text === 'string' ? msg.text.trim().slice(0, 200) : '';
	if (!text) return;

	const player = room.players.get(state.id);
	if (!player) return;

	const chatMsg: ChatMessage = {
		id: generateId(),
		senderId: state.id,
		senderName: player.name,
		type: 'chat',
		text,
		timestamp: Date.now()
	};
	addMessage(room, chatMsg);
	broadcastToRoom(room, {
		type: 'chat-message',
		id: chatMsg.id,
		senderId: chatMsg.senderId,
		senderName: chatMsg.senderName,
		messageType: chatMsg.type,
		text: chatMsg.text,
		timestamp: chatMsg.timestamp
	});
}

function handleEmote(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	if (!ALLOWED_EMOTES.has(msg.emote)) return;

	const player = room.players.get(state.id);
	if (!player) return;

	const chatMsg: ChatMessage = {
		id: generateId(),
		senderId: state.id,
		senderName: player.name,
		type: 'emote',
		text: msg.emote,
		timestamp: Date.now()
	};
	addMessage(room, chatMsg);
	broadcastToRoom(room, {
		type: 'emote',
		id: chatMsg.id,
		senderId: chatMsg.senderId,
		senderName: chatMsg.senderName,
		messageType: chatMsg.type,
		text: chatMsg.text,
		timestamp: chatMsg.timestamp
	});
}

function handleDisconnect(ws: WebSocket, state: ClientState): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	if (state.isSpectator) {
		removeSpectatorFromRoom(room, state.id);
		return;
	}

	// For ghost rooms: save incomplete run if player had an active run
	if (room.mode === 'ghost' && room.activeRuns) {
		const activeRun = room.activeRuns.get(state.id);
		if (activeRun) {
			if (activeRun.broadcastTimer) clearInterval(activeRun.broadcastTimer);
			// Save as incomplete run
			room.completedRuns.push({
				runnerId: activeRun.runnerId,
				runnerName: activeRun.runnerName,
				samples: activeRun.samples,
				startedAt: activeRun.personalStartTime,
				finishedAt: null,
				finalDistance: activeRun.samples.length > 0 ? activeRun.samples[activeRun.samples.length - 1].distance : 0
			});
			room.activeRuns.delete(state.id);
			lastSaveTimes.delete(room.code);
			saveGhostRace(room.code, buildGhostRaceFile(room));
		}
	}

	removePlayerFromRoom(room, state.id);

	broadcastToRoom(room, {
		type: 'player-left',
		playerId: state.id,
		players: getPlayerList(room)
	});
}
