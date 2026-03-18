import { WebSocketServer, type WebSocket } from 'ws';
import type { Server } from 'http';
import {
	createRoom,
	getRoom,
	addPlayerToRoom,
	removePlayerFromRoom,
	broadcastToRoom,
	getPlayerList,
	addMessage,
	type RaceRoom,
	type ChatMessage
} from './race-rooms.js';
import { generateRaceCode } from './race-code.js';

interface ClientState {
	id: string;
	roomCode: string | null;
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

export function setupWebSocketServer(server: Server): WebSocketServer {
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
		const state: ClientState = { id: clientId, roomCode: null };
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
		case 'ready':
			handleReady(ws, state, msg);
			break;
		case 'start-race':
			handleStartRace(ws, state);
			break;
		case 'cancel-countdown':
			handleCancelCountdown(ws, state);
			break;
		case 'rtc-offer':
		case 'rtc-answer':
		case 'rtc-ice':
			handleRtcSignaling(ws, state, msg);
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
	const room = getRoom(code);

	if (!room) {
		send(ws, { type: 'error', message: 'Race not found' });
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

	room.phase = 'countdown';
	broadcastToRoom(room, { type: 'countdown-start' });

	// Countdown from 10 to 0
	let count = 10;
	room.countdownTimer = setInterval(() => {
		count--;
		broadcastToRoom(room, { type: 'countdown-tick', value: count });
		if (count <= 0) {
			clearInterval(room.countdownTimer!);
			room.countdownTimer = null;
			room.phase = 'racing';
			broadcastToRoom(room, { type: 'race-started' });
		}
	}, 1000);
}

function handleCancelCountdown(ws: WebSocket, state: ClientState): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;
	if (state.id !== room.ownerId) return;
	if (room.phase !== 'countdown') return;

	if (room.countdownTimer) {
		clearInterval(room.countdownTimer);
		room.countdownTimer = null;
	}
	room.phase = 'lobby';
	broadcastToRoom(room, { type: 'countdown-cancelled' });
}

function handleRtcSignaling(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	const target = room.players.get(msg.targetId);
	if (target) {
		send(target.ws, {
			type: msg.type,
			fromId: state.id,
			payload: msg.payload
		});
	}
}

function handleDistance(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room || room.phase !== 'racing') return;

	broadcastToRoom(room, {
		type: 'player-distance',
		playerId: state.id,
		distance: msg.distance
	}, state.id);
}

function handleFinished(ws: WebSocket, state: ClientState, msg: any): void {
	if (!state.roomCode) return;
	const room = getRoom(state.roomCode);
	if (!room) return;

	broadcastToRoom(room, {
		type: 'player-finished',
		playerId: state.id
	}, state.id);
}

const ALLOWED_EMOTES = new Set(['🏃', '💨', '🔥', '😤', '💀', '🥵', '😂', '👋', '💪', '🏆']);

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

	removePlayerFromRoom(room, state.id);

	broadcastToRoom(room, {
		type: 'player-left',
		playerId: state.id,
		players: getPlayerList(room)
	});
}
