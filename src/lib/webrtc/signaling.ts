type MessageHandler = (msg: any) => void;

export class SignalingClient {
	private ws: WebSocket | null = null;
	private handlers = new Map<string, MessageHandler[]>();
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private url: string;

	constructor() {
		const protocol = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = typeof location !== 'undefined' ? location.host : 'localhost:3000';
		this.url = `${protocol}//${host}/ws`;
	}

	clearHandlers(): void {
		this.handlers.clear();
	}

	connect(): void {
		if (this.ws?.readyState === WebSocket.OPEN) return;

		this.ws = new WebSocket(this.url);

		this.ws.onopen = () => {
			this.emit('open', {});
		};

		this.ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				this.emit(msg.type, msg);
			} catch {
				// Ignore
			}
		};

		this.ws.onclose = () => {
			this.emit('close', {});
			this.scheduleReconnect();
		};

		this.ws.onerror = () => {
			// Close handler will fire next
		};
	}

	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws) {
			this.ws.onclose = null;
			this.ws.close();
			this.ws = null;
		}
	}

	send(msg: object): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(msg));
		}
	}

	on(type: string, handler: MessageHandler): () => void {
		if (!this.handlers.has(type)) {
			this.handlers.set(type, []);
		}
		this.handlers.get(type)!.push(handler);
		return () => {
			const arr = this.handlers.get(type);
			if (arr) {
				const idx = arr.indexOf(handler);
				if (idx >= 0) arr.splice(idx, 1);
			}
		};
	}

	private emit(type: string, msg: any): void {
		const arr = this.handlers.get(type);
		if (arr) {
			for (const handler of arr) {
				handler(msg);
			}
		}
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimer) return;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, 2000);
	}
}

export const signaling = new SignalingClient();
