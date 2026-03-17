import { signaling } from './signaling.js';

type DataChannelCallback = (peerId: string, channel: RTCDataChannel) => void;

const RTC_CONFIG: RTCConfiguration = {
	iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export class PeerManager {
	private connections = new Map<string, RTCPeerConnection>();
	private channels = new Map<string, RTCDataChannel>();
	private myId: string = '';
	private onChannelOpen: DataChannelCallback | null = null;
	private cleanupFns: (() => void)[] = [];

	setMyId(id: string): void {
		this.myId = id;
	}

	onDataChannel(cb: DataChannelCallback): void {
		this.onChannelOpen = cb;
	}

	startSignaling(peerIds: string[]): void {
		// Listen for signaling messages
		this.cleanupFns.push(
			signaling.on('rtc-offer', (msg) => this.handleOffer(msg.fromId, msg.payload)),
			signaling.on('rtc-answer', (msg) => this.handleAnswer(msg.fromId, msg.payload)),
			signaling.on('rtc-ice', (msg) => this.handleIce(msg.fromId, msg.payload))
		);

		// Create offers to peers where our ID is lexicographically smaller
		for (const peerId of peerIds) {
			if (peerId !== this.myId && this.myId < peerId) {
				this.createOffer(peerId);
			}
		}
	}

	sendToAll(data: string): void {
		for (const channel of this.channels.values()) {
			if (channel.readyState === 'open') {
				channel.send(data);
			}
		}
	}

	destroy(): void {
		for (const fn of this.cleanupFns) fn();
		this.cleanupFns = [];
		for (const conn of this.connections.values()) {
			conn.close();
		}
		this.connections.clear();
		this.channels.clear();
	}

	private getOrCreateConnection(peerId: string): RTCPeerConnection {
		let pc = this.connections.get(peerId);
		if (pc) return pc;

		pc = new RTCPeerConnection(RTC_CONFIG);
		this.connections.set(peerId, pc);

		pc.onicecandidate = (e) => {
			if (e.candidate) {
				signaling.send({
					type: 'rtc-ice',
					targetId: peerId,
					payload: e.candidate.toJSON()
				});
			}
		};

		pc.ondatachannel = (e) => {
			this.setupChannel(peerId, e.channel);
		};

		return pc;
	}

	private async createOffer(peerId: string): Promise<void> {
		const pc = this.getOrCreateConnection(peerId);
		const channel = pc.createDataChannel('race');
		this.setupChannel(peerId, channel);

		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		signaling.send({
			type: 'rtc-offer',
			targetId: peerId,
			payload: pc.localDescription!.toJSON()
		});
	}

	private async handleOffer(fromId: string, payload: RTCSessionDescriptionInit): Promise<void> {
		const pc = this.getOrCreateConnection(fromId);
		await pc.setRemoteDescription(new RTCSessionDescription(payload));
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		signaling.send({
			type: 'rtc-answer',
			targetId: fromId,
			payload: pc.localDescription!.toJSON()
		});
	}

	private async handleAnswer(fromId: string, payload: RTCSessionDescriptionInit): Promise<void> {
		const pc = this.connections.get(fromId);
		if (pc) {
			await pc.setRemoteDescription(new RTCSessionDescription(payload));
		}
	}

	private async handleIce(fromId: string, payload: RTCIceCandidateInit): Promise<void> {
		const pc = this.connections.get(fromId);
		if (pc) {
			await pc.addIceCandidate(new RTCIceCandidate(payload));
		}
	}

	private setupChannel(peerId: string, channel: RTCDataChannel): void {
		channel.onopen = () => {
			this.channels.set(peerId, channel);
			this.onChannelOpen?.(peerId, channel);
		};

		channel.onclose = () => {
			this.channels.delete(peerId);
		};
	}
}

export const peerManager = new PeerManager();
