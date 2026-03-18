<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
	import type { Player } from '$lib/stores/race.svelte.js';

	let { player, ghost = false }: { player: Player; ghost?: boolean } = $props();

	const progress = $derived(
		Math.min(100, (player.distance / raceState.targetDistance) * 100)
	);

	const isMe = $derived(player.id === raceState.myId);
	const isGhost = $derived(ghost || (raceState.isGhostRace && raceState.ghostPlayers.some((gp) => gp.id === player.id)));

	function formatDistance(m: number): string {
		if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
		return `${Math.round(m)} m`;
	}

	function medal(order: number | null): string {
		if (order === 1) return '🥇';
		if (order === 2) return '🥈';
		if (order === 3) return '🥉';
		return '';
	}
</script>

<div class="player-card card" class:me={isMe} class:finished={player.finished} class:ghost={isGhost}>
	<div class="header">
		<span class="name">
			{player.finished ? medal(player.finishOrder) : ''}
			{player.name}
			{#if isMe}<span class="you-tag">YOU</span>{/if}
			{#if isGhost}<span class="ghost-tag">GHOST</span>{/if}
		</span>
		<span class="distance">{formatDistance(player.distance)}</span>
	</div>
	<div class="progress-track">
		<div class="progress-bar" style="width: {progress}%"></div>
	</div>
</div>

<style>
	.player-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 16px;
	}

	.me {
		border-color: var(--accent);
	}

	.finished {
		opacity: 0.8;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.name {
		font-weight: 700;
		font-size: 0.95rem;
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

	.distance {
		font-size: 0.9rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.progress-track {
		height: 6px;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
		transition: width 0.3s ease-out;
	}

	.finished .progress-bar {
		background: #4ade80;
	}

	.ghost {
		opacity: 0.5;
	}

	.ghost .progress-bar {
		background: #a78bfa;
	}

	.ghost-tag {
		font-size: 0.6rem;
		background: rgba(139, 92, 246, 0.3);
		color: #a78bfa;
		padding: 2px 5px;
		border-radius: 4px;
		margin-left: 6px;
		font-weight: 700;
		vertical-align: middle;
	}
</style>
