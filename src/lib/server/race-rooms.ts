export interface RoomPlayer {
	id: string;
	name: string;
	ready: boolean;
	ws: import('ws').WebSocket;
}

export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	type: 'chat' | 'emote';
	text: string;
	timestamp: number;
}

export interface RaceRoom {
	code: string;
	name: string;
	ownerId: string;
	targetDistance: number;
	players: Map<string, RoomPlayer>;
	phase: 'lobby' | 'countdown' | 'racing' | 'finished';
	countdownTimer: ReturnType<typeof setInterval> | null;
	createdAt: number;
	messages: ChatMessage[];
}

const rooms = new Map<string, RaceRoom>();

// Clean up stale rooms older than 1 hour
const ROOM_TTL = 60 * 60 * 1000;
setInterval(() => {
	const now = Date.now();
	for (const [code, room] of rooms) {
		if (now - room.createdAt > ROOM_TTL) {
			rooms.delete(code);
		}
	}
}, 60_000);

export function createRoom(code: string, name: string, ownerId: string, targetDistance: number): RaceRoom {
	const room: RaceRoom = {
		code,
		name,
		ownerId,
		targetDistance,
		players: new Map(),
		phase: 'lobby',
		countdownTimer: null,
		createdAt: Date.now(),
		messages: []
	};
	rooms.set(code, room);
	return room;
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
	if (room.players.size === 0) {
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
