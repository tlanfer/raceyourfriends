export type RacePhase = 'setup' | 'lobby' | 'countdown' | 'racing' | 'finished';
export type GhostPersonalPhase = 'waiting' | 'countdown' | 'racing' | 'finished';

export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	type: 'chat' | 'emote';
	text: string;
	timestamp: number;
}

export interface Player {
	id: string;
	name: string;
	distance: number;
	ready: boolean;
	finished: boolean;
	finishOrder: number | null;
}

export interface GhostRunSummary {
	runnerId: string;
	runnerName: string;
	finalDistance: number;
	finishedAt: number | null;
	startedAt: number;
}

export interface GhostPlaybackRun {
	runnerId: string;
	runnerName: string;
	samples: { elapsed_ms: number; distance: number }[];
}

export interface GhostPlayer {
	id: string;
	name: string;
	distance: number;
	finished: boolean;
	isGhost: boolean;
}

function loadFromStorage(key: string, fallback: string): string {
	if (typeof localStorage === 'undefined') return fallback;
	return localStorage.getItem(key) ?? fallback;
}

function saveToStorage(key: string, value: string): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(key, value);
}

class RaceState {
	phase = $state<RacePhase>('setup');
	raceCode = $state('');
	raceName = $state('');
	myId = $state('');
	playerName = $state(loadFromStorage('playerName', ''));
	targetDistance = $state(Number(loadFromStorage('targetDistance', '5000')));
	isOwner = $state(false);
	players = $state<Player[]>([]);
	startTime = $state<number | null>(null);
	myDistance = $state(0);
	gpsAccuracy = $state<number | null>(null);
	gpsHasSignal = $state(false);
	messages = $state<ChatMessage[]>([]);

	// Ghost race fields
	isGhostRace = $state(false);
	ghostExpiresAt = $state<number | null>(null);
	ghostRuns = $state<GhostRunSummary[]>([]);
	ghostPlaybackData = $state<GhostPlaybackRun[]>([]);
	ghostPlayers = $state<GhostPlayer[]>([]);
	myPersonalPhase = $state<GhostPersonalPhase>('waiting');
	ghostPersonalStartTime = $state<number | null>(null);

	get myPlayer(): Player | undefined {
		return this.players.find((p) => p.id === this.myId);
	}

	get allReady(): boolean {
		return this.players.length >= 2 && this.players.every((p) => p.ready);
	}

	get finishCount(): number {
		return this.players.filter((p) => p.finished).length;
	}

	get allFinished(): boolean {
		return this.players.length > 0 && this.players.every((p) => p.finished);
	}

	setPlayerName(name: string): void {
		this.playerName = name;
		saveToStorage('playerName', name);
	}

	setTargetDistance(dist: number): void {
		this.targetDistance = dist;
		saveToStorage('targetDistance', String(dist));
	}

	addPlayer(player: Player): void {
		if (!this.players.find((p) => p.id === player.id)) {
			this.players.push(player);
		}
	}

	removePlayer(id: string): void {
		this.players = this.players.filter((p) => p.id !== id);
	}

	updatePlayerDistance(id: string, distance: number): void {
		const player = this.players.find((p) => p.id === id);
		if (player) {
			player.distance = distance;
		}
	}

	setPlayerReady(id: string, ready: boolean): void {
		const player = this.players.find((p) => p.id === id);
		if (player) {
			player.ready = ready;
		}
	}

	addMessage(msg: ChatMessage): void {
		this.messages.push(msg);
	}

	markPlayerFinished(id: string): void {
		const player = this.players.find((p) => p.id === id);
		if (player && !player.finished) {
			player.finished = true;
			player.finishOrder = this.finishCount;
		}
	}

	reset(): void {
		this.phase = 'setup';
		this.raceCode = '';
		this.raceName = '';
		this.myId = '';
		this.isOwner = false;
		this.players = [];
		this.startTime = null;
		this.myDistance = 0;
		this.gpsAccuracy = null;
		this.gpsHasSignal = false;
		this.messages = [];
		this.isGhostRace = false;
		this.ghostExpiresAt = null;
		this.ghostRuns = [];
		this.ghostPlaybackData = [];
		this.ghostPlayers = [];
		this.myPersonalPhase = 'waiting';
		this.ghostPersonalStartTime = null;
	}
}

export const raceState = new RaceState();
