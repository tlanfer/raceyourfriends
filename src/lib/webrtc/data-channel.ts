import { peerManager } from './peer-manager.js';
import { raceState } from '../stores/race.svelte.js';

export interface DistanceMessage {
	type: 'distance';
	distance: number;
}

export interface FinishedMessage {
	type: 'finished';
}

export type DataMessage = DistanceMessage | FinishedMessage;

let broadcastInterval: ReturnType<typeof setInterval> | null = null;

export function startBroadcasting(): void {
	stopBroadcasting();
	broadcastInterval = setInterval(() => {
		const msg: DistanceMessage = {
			type: 'distance',
			distance: raceState.myDistance
		};
		peerManager.sendToAll(JSON.stringify(msg));
	}, 1000);
}

export function stopBroadcasting(): void {
	if (broadcastInterval) {
		clearInterval(broadcastInterval);
		broadcastInterval = null;
	}
}

export function handlePeerMessage(peerId: string, data: string): void {
	try {
		const msg: DataMessage = JSON.parse(data);
		switch (msg.type) {
			case 'distance':
				raceState.updatePlayerDistance(peerId, msg.distance);
				break;
			case 'finished':
				raceState.markPlayerFinished(peerId);
				break;
		}
	} catch {
		// Ignore malformed
	}
}
