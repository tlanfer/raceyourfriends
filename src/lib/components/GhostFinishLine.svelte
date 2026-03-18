<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
	import { goto } from '$app/navigation';
	import { signaling } from '$lib/signaling.js';

	const allRuns = $derived(
		[...raceState.ghostRuns]
			.filter((r) => r.finishedAt != null)
			.sort((a, b) => {
				const aDuration = a.finishedAt! - a.startedAt;
				const bDuration = b.finishedAt! - b.startedAt;
				return aDuration - bDuration;
			})
	);

	const myRank = $derived(
		allRuns.findIndex((r) => r.runnerId === raceState.myId) + 1
	);

	function medal(index: number): string {
		if (index === 0) return '\u{1F947}';
		if (index === 1) return '\u{1F948}';
		if (index === 2) return '\u{1F949}';
		return '';
	}

	function formatDistance(m: number): string {
		if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
		return `${Math.round(m)} m`;
	}

	function formatDuration(startedAt: number, finishedAt: number): string {
		const ms = finishedAt - startedAt;
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function runAgain() {
		raceState.myPersonalPhase = 'waiting';
		raceState.myDistance = 0;
		raceState.ghostPlayers = [];
		raceState.ghostPlaybackData = [];
	}

	function newRace() {
		signaling.disconnect();
		raceState.reset();
		goto('/');
	}
</script>

<div class="finish">
	<h1>Run Complete!</h1>

	{#if myRank > 0}
		<div class="my-rank">
			<span class="rank-number">#{myRank}</span>
			<span class="rank-label">of {allRuns.length} runners</span>
		</div>
	{/if}

	<div class="my-stats card">
		<div class="stat">
			<span class="stat-label">Distance</span>
			<span class="stat-value">{formatDistance(raceState.myDistance)}</span>
		</div>
	</div>

	<div class="results">
		<h2>Leaderboard</h2>
		{#each allRuns as run, i}
			<div class="result-row card" class:me={run.runnerId === raceState.myId}>
				<span class="medal">{medal(i)}</span>
				<div class="info">
					<span class="name">
						{run.runnerName}
						{#if run.runnerId === raceState.myId}<span class="you-tag">YOU</span>{/if}
					</span>
					<span class="stats">
						{formatDistance(run.finalDistance)} &middot; {formatDuration(run.startedAt, run.finishedAt!)}
					</span>
				</div>
				<span class="order">#{i + 1}</span>
			</div>
		{/each}
	</div>

	<div class="actions">
		<button class="btn btn-secondary" onclick={runAgain}>Run Again</button>
		<button class="btn btn-primary" onclick={newRace}>New Race</button>
	</div>
</div>

<style>
	.finish {
		display: flex;
		flex-direction: column;
		gap: 20px;
		align-items: center;
		padding-top: 24px;
		flex: 1;
		min-height: 0;
	}

	h1 {
		font-size: 1.8rem;
		text-align: center;
	}

	h2 {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.my-rank {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.rank-number {
		font-size: 2.5rem;
		font-weight: 900;
		color: var(--accent);
	}

	.rank-label {
		color: var(--text-muted);
		font-size: 1rem;
	}

	.my-stats {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 16px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 1.3rem;
		font-weight: 800;
	}

	.results {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
	}

	.result-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
	}

	.me {
		border-color: var(--accent);
	}

	.medal {
		font-size: 1.3rem;
		min-width: 28px;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.name {
		font-weight: 700;
	}

	.you-tag {
		font-size: 0.65rem;
		background: var(--accent);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		margin-left: 6px;
		font-weight: 700;
		vertical-align: middle;
	}

	.stats {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.order {
		font-weight: 700;
		color: var(--text-muted);
	}

	.actions {
		width: 100%;
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	.actions .btn {
		flex: 1;
	}
</style>
