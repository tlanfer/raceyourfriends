import type { WebSocket } from 'ws';

export interface RoomPlayer {
	id: string;
	name: string;
	ready: boolean;
	ws: WebSocket;
}

export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	type: 'chat' | 'emote';
	text: string;
	timestamp: number;
}

export interface Spectator {
	id: string;
	ws: WebSocket;
}

export interface GhostSample {
	elapsed_ms: number;
	distance: number;
}

export interface GhostRun {
	runnerId: string;
	runnerName: string;
	samples: GhostSample[];
	startedAt: number;
	finishedAt: number | null;
	finalDistance: number;
}

export interface ActiveGhostRun {
	runnerId: string;
	runnerName: string;
	samples: GhostSample[];
	personalStartTime: number;
	broadcastTimer: ReturnType<typeof setInterval> | null;
}

export interface RaceRoom {
	code: string;
	name: string;
	ownerId: string;
	targetDistance: number;
	players: Map<string, RoomPlayer>;
	spectators: Map<string, Spectator>;
	phase: 'lobby' | 'countdown' | 'racing' | 'finished';
	countdownTimer: ReturnType<typeof setTimeout> | null;
	broadcastTimer: ReturnType<typeof setInterval> | null;
	startTime: number | null;
	distances: Map<string, number>;
	finishedPlayers: Set<string>;
	createdAt: number;
	messages: ChatMessage[];
	mode: 'live' | 'ghost';
	expiresAt: number | null;
	completedRuns: GhostRun[];
	activeRuns: Map<string, ActiveGhostRun> | null;
}

const rooms = new Map<string, RaceRoom>();

// Clean up stale rooms older than 1 hour (live) or expiresAt + 24h (ghost)
const ROOM_TTL = 60 * 60 * 1000;
const GHOST_RESULTS_TTL = 24 * 60 * 60 * 1000;

let onGhostRoomCleanup: ((code: string) => void) | null = null;

export function setGhostRoomCleanupHandler(handler: (code: string) => void): void {
	onGhostRoomCleanup = handler;
}

setInterval(() => {
	const now = Date.now();
	for (const [code, room] of rooms) {
		if (room.mode === 'ghost') {
			const expiry = (room.expiresAt ?? room.createdAt) + GHOST_RESULTS_TTL;
			if (now > expiry) {
				cleanupRoom(room);
				rooms.delete(code);
				onGhostRoomCleanup?.(code);
			}
		} else {
			if (now - room.createdAt > ROOM_TTL) {
				cleanupRoom(room);
				rooms.delete(code);
			}
		}
	}
}, 60_000);

function cleanupRoom(room: RaceRoom): void {
	if (room.broadcastTimer) clearInterval(room.broadcastTimer);
	if (room.countdownTimer) clearTimeout(room.countdownTimer);
	if (room.activeRuns) {
		for (const run of room.activeRuns.values()) {
			if (run.broadcastTimer) clearInterval(run.broadcastTimer);
		}
	}
}

export function createRoom(
	code: string,
	name: string,
	ownerId: string,
	targetDistance: number,
	mode: 'live' | 'ghost' = 'live',
	expiresAt: number | null = null
): RaceRoom {
	const room: RaceRoom = {
		code,
		name,
		ownerId,
		targetDistance,
		players: new Map(),
		spectators: new Map(),
		phase: 'lobby',
		countdownTimer: null,
		broadcastTimer: null,
		startTime: null,
		distances: new Map(),
		finishedPlayers: new Set(),
		createdAt: Date.now(),
		messages: [],
		mode,
		expiresAt,
		completedRuns: [],
		activeRuns: mode === 'ghost' ? new Map() : null
	};
	rooms.set(code, room);
	return room;
}

export function setRoom(code: string, room: RaceRoom): void {
	rooms.set(code, room);
}

export function getRoom(code: string): RaceRoom | undefined {
	return rooms.get(code);
}

export function deleteRoom(code: string): void {
	rooms.delete(code);
}

export function addPlayerToRoom(room: RaceRoom, player: RoomPlayer): void {
	room.players.set(player.id, player);
}

export function removePlayerFromRoom(room: RaceRoom, playerId: string): void {
	room.players.delete(playerId);
	if (room.mode === 'ghost') return; // Ghost rooms persist without players
	if (room.players.size === 0 && room.spectators.size === 0) {
		cleanupRoom(room);
		rooms.delete(room.code);
	}
}

export function broadcastToRoom(room: RaceRoom, message: object, excludeId?: string): void {
	const data = JSON.stringify(message);
	for (const [id, player] of room.players) {
		if (id !== excludeId && player.ws.readyState === 1) {
			player.ws.send(data);
		}
	}
	for (const [id, spectator] of room.spectators) {
		if (id !== excludeId && spectator.ws.readyState === 1) {
			spectator.ws.send(data);
		}
	}
}

export function addSpectatorToRoom(room: RaceRoom, spectator: Spectator): void {
	room.spectators.set(spectator.id, spectator);
}

export function removeSpectatorFromRoom(room: RaceRoom, spectatorId: string): void {
	room.spectators.delete(spectatorId);
}

export function getPlayerList(room: RaceRoom): Array<{ id: string; name: string; ready: boolean }> {
	return Array.from(room.players.values()).map((p) => ({
		id: p.id,
		name: p.name,
		ready: p.ready
	}));
}

const MESSAGE_TTL = 5 * 60 * 1000;

export function addMessage(room: RaceRoom, msg: ChatMessage): void {
	room.messages.push(msg);
	const cutoff = Date.now() - MESSAGE_TTL;
	while (room.messages.length > 0 && room.messages[0].timestamp < cutoff) {
		room.messages.shift();
	}
}
