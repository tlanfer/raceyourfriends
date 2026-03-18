<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';
	import ChatPanel from './ChatPanel.svelte';

	let copied = $state(false);
	let timeRemaining = $state('');
	let timer: ReturnType<typeof setInterval> | null = null;

	const expired = $derived(
		raceState.ghostExpiresAt != null && Date.now() > raceState.ghostExpiresAt
	);

	const completedRuns = $derived(
		[...raceState.ghostRuns]
			.filter((r) => r.finishedAt != null)
			.sort((a, b) => {
				const aDuration = a.finishedAt! - a.startedAt;
				const bDuration = b.finishedAt! - b.startedAt;
				return aDuration - bDuration;
			})
	);

	const incompleteRuns = $derived(
		raceState.ghostRuns.filter((r) => r.finishedAt == null)
	);

	function updateTimeRemaining() {
		if (!raceState.ghostExpiresAt) {
			timeRemaining = '';
			return;
		}
		const diff = raceState.ghostExpiresAt - Date.now();
		if (diff <= 0) {
			timeRemaining = 'Expired';
			return;
		}
		const days = Math.floor(diff / (24 * 60 * 60 * 1000));
		const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
		const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
		if (days > 0) {
			timeRemaining = `${days}d ${hours}h remaining`;
		} else if (hours > 0) {
			timeRemaining = `${hours}h ${minutes}m remaining`;
		} else {
			timeRemaining = `${minutes}m remaining`;
		}
	}

	onMount(() => {
		updateTimeRemaining();
		timer = setInterval(updateTimeRemaining, 60_000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});

	const hasGps = $derived(raceState.gpsHasSignal);

	function startMyRun() {
		if (!hasGps) return;
		signaling.send({ type: 'ghost-start-run' });
	}

	async function copyCode() {
		const url = `${location.origin}/join/${raceState.raceCode}`;
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Fallback
		}
	}

	function formatDistance(m: number): string {
		return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
	}

	function formatDuration(startedAt: number, finishedAt: number): string {
		const ms = finishedAt - startedAt;
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function leaveRace() {
		signaling.disconnect();
		raceState.reset();
		goto('/');
	}

	function medal(index: number): string {
		if (index === 0) return '\u{1F947}';
		if (index === 1) return '\u{1F948}';
		if (index === 2) return '\u{1F949}';
		return '';
	}
</script>

<div class="ghost-lobby">
	<div class="top-bar card">
		<div class="race-info">
			<span class="race-name">{raceState.raceName}</span>
			<div class="code-row">
				<span class="code">{raceState.raceCode}</span>
				<button class="btn-copy" onclick={copyCode}>
					{copied ? 'Copied!' : 'Copy Link'}
				</button>
				<span class="distance">{formatDistance(raceState.targetDistance)}</span>
			</div>
			<div class="mode-badge">Ghost Race</div>
		</div>

		{#if timeRemaining}
			<div class="time-remaining" class:expired>
				{timeRemaining}
			</div>
		{/if}

		{#if !expired}
			{#if !hasGps}
				<div class="gps-status">
					<span class="gps-spinner"></span>
					Waiting for GPS signal...
				</div>
			{/if}
			<button class="btn btn-primary start-btn" onclick={startMyRun} disabled={!hasGps}>
				Start My Run
			</button>
			<button class="btn-leave" onclick={leaveRace}>Leave Race</button>
		{:else}
			<div class="expired-notice">This race has closed</div>
			<button class="btn btn-secondary start-btn" onclick={leaveRace}>Back to Home</button>
		{/if}
	</div>

	{#if completedRuns.length > 0}
		<div class="leaderboard">
			<h2>Leaderboard</h2>
			{#each completedRuns as run, i}
				<div class="result-row card">
					<span class="medal">{medal(i)}</span>
					<div class="info">
						<span class="name">{run.runnerName}</span>
						<span class="stats">
							{formatDistance(run.finalDistance)} &middot; {formatDuration(run.startedAt, run.finishedAt!)}
						</span>
					</div>
					<span class="rank">#{i + 1}</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if incompleteRuns.length > 0}
		<div class="incomplete">
			<h2>Incomplete Runs</h2>
			{#each incompleteRuns as run}
				<div class="result-row card muted">
					<div class="info">
						<span class="name">{run.runnerName}</span>
						<span class="stats">{formatDistance(run.finalDistance)} &middot; DNF</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<ChatPanel />
</div>

<style>
	.ghost-lobby {
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1;
		min-height: 0;
	}

	.top-bar {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
	}

	.race-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.race-name {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.code-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.code {
		font-size: 1.4rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		color: var(--accent);
	}

	.btn-copy {
		font-size: 0.75rem;
		padding: 4px 10px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		font-weight: 600;
	}

	.distance {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-left: auto;
	}

	.mode-badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 3px 8px;
		border-radius: 6px;
		background: rgba(139, 92, 246, 0.2);
		color: #a78bfa;
		width: fit-content;
	}

	.time-remaining {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.time-remaining.expired {
		color: var(--accent);
	}

	.start-btn {
		width: 100%;
		font-size: 1.1rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 14px;
	}

	.expired-notice {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.9rem;
		padding: 10px;
	}

	.leaderboard,
	.incomplete {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	h2 {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.result-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
	}

	.muted {
		opacity: 0.5;
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
		font-size: 0.95rem;
	}

	.stats {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.rank {
		font-weight: 700;
		color: var(--text-muted);
	}

	.gps-status {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.gps-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.btn-leave {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.8rem;
		padding: 8px;
		cursor: pointer;
		text-align: center;
		width: 100%;
	}

	.btn-leave:hover {
		color: var(--text);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
