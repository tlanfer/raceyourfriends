<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
	import { goto } from '$app/navigation';
	import { signaling } from '$lib/webrtc/signaling.js';
	import ChatPanel from './ChatPanel.svelte';

	const sorted = $derived(
		[...raceState.players]
			.filter((p) => p.finished)
			.sort((a, b) => (a.finishOrder ?? 999) - (b.finishOrder ?? 999))
	);

	const unfinished = $derived(
		raceState.players.filter((p) => !p.finished)
	);

	function medal(order: number | null): string {
		if (order === 1) return '🥇';
		if (order === 2) return '🥈';
		if (order === 3) return '🥉';
		return '';
	}

	function formatDistance(m: number): string {
		if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
		return `${Math.round(m)} m`;
	}

	function newRace() {
		signaling.disconnect();
		raceState.reset();
		goto('/');
	}
</script>

<div class="finish">
	<h1>Race Complete!</h1>

	<div class="results">
		{#each sorted as player}
			<div class="result-row card" class:me={player.id === raceState.myId}>
				<span class="medal">{medal(player.finishOrder)}</span>
				<div class="info">
					<span class="name">{player.name}</span>
					<span class="dist">{formatDistance(player.distance)}</span>
				</div>
				<span class="order">#{player.finishOrder}</span>
			</div>
		{/each}
	</div>

	{#if unfinished.length > 0}
		<div class="still-racing">
			<span class="label">Still racing...</span>
			{#each unfinished as player}
				<div class="result-row card muted">
					<div class="info">
						<span class="name">{player.name}</span>
						<span class="dist">{formatDistance(player.distance)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<button class="btn btn-primary" onclick={newRace}>New Race</button>

	<ChatPanel />
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

	.results,
	.still-racing {
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
		padding: 14px 16px;
	}

	.me {
		border-color: var(--accent);
	}

	.muted {
		opacity: 0.5;
	}

	.medal {
		font-size: 1.5rem;
		min-width: 32px;
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

	.dist {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.order {
		font-weight: 700;
		color: var(--text-muted);
	}

	.label {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.btn {
		width: 100%;
		margin-top: 12px;
	}
</style>
