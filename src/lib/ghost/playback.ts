import type { GhostPlaybackRun, GhostPlayer } from '$lib/stores/race.svelte.js';

export class GhostPlayback {
	private runs: GhostPlaybackRun[];
	private onUpdate: (players: GhostPlayer[]) => void;
	private startTime = 0;
	private rafId: number | null = null;
	private running = false;

	constructor(runs: GhostPlaybackRun[], onUpdate: (players: GhostPlayer[]) => void) {
		this.runs = runs;
		this.onUpdate = onUpdate;
	}

	start(): void {
		this.startTime = Date.now();
		this.running = true;
		this.tick();
	}

	stop(): void {
		this.running = false;
		if (this.rafId != null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	addSample(runnerId: string, sample: { elapsed_ms: number; distance: number }): void {
		const run = this.runs.find((r) => r.runnerId === runnerId);
		if (run) {
			run.samples.push(sample);
		}
	}

	addRun(run: GhostPlaybackRun): void {
		this.runs.push(run);
	}

	private tick = (): void => {
		if (!this.running) return;

		const elapsed = Date.now() - this.startTime;
		const players: GhostPlayer[] = this.runs.map((run) => ({
			id: run.runnerId,
			name: run.runnerName,
			distance: interpolateDistance(run.samples, elapsed),
			finished: isFinished(run.samples, elapsed),
			isGhost: true
		}));

		this.onUpdate(players);

		this.rafId = requestAnimationFrame(this.tick);
	};
}

function interpolateDistance(
	samples: { elapsed_ms: number; distance: number }[],
	elapsed: number
): number {
	if (samples.length === 0) return 0;
	if (elapsed <= samples[0].elapsed_ms) return samples[0].distance;
	if (elapsed >= samples[samples.length - 1].elapsed_ms) {
		return samples[samples.length - 1].distance;
	}

	// Binary search for the bracket
	let lo = 0;
	let hi = samples.length - 1;
	while (lo < hi - 1) {
		const mid = (lo + hi) >> 1;
		if (samples[mid].elapsed_ms <= elapsed) {
			lo = mid;
		} else {
			hi = mid;
		}
	}

	const a = samples[lo];
	const b = samples[hi];
	const t = (elapsed - a.elapsed_ms) / (b.elapsed_ms - a.elapsed_ms);
	return a.distance + (b.distance - a.distance) * t;
}

function isFinished(
	samples: { elapsed_ms: number; distance: number }[],
	elapsed: number
): boolean {
	if (samples.length === 0) return false;
	return elapsed >= samples[samples.length - 1].elapsed_ms;
}
