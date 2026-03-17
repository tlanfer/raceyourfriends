let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
}

export function playBeep(frequency = 800, duration = 0.15): void {
	try {
		const ctx = getAudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.frequency.value = frequency;
		osc.type = 'square';
		gain.gain.value = 0.3;
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + duration);
	} catch {
		// Audio not available
	}
}

export function playCountdownBeep(): void {
	playBeep(800, 0.15);
}

export function playGoSound(): void {
	playBeep(1200, 0.4);
}

export function playFinishSound(): void {
	playBeep(1000, 0.1);
	setTimeout(() => playBeep(1200, 0.1), 120);
	setTimeout(() => playBeep(1500, 0.3), 240);
}

export function playChatBlip(): void {
	try {
		const ctx = getAudioContext();
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.type = 'sine';
		osc.frequency.setValueAtTime(880, t);
		osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
		gain.gain.setValueAtTime(0.12, t);
		gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
		osc.start(t);
		osc.stop(t + 0.12);
	} catch {
		// Audio not available
	}
}
