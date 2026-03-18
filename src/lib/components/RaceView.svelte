<script lang="ts">
	import { tick } from 'svelte';
	import { raceState } from '$lib/stores/race.svelte.js';
	import PlayerCard from './PlayerCard.svelte';
	import GpsStatus from './GpsStatus.svelte';
	import ChatPanel from './ChatPanel.svelte';

	import type { Player } from '$lib/stores/race.svelte.js';

	function formatDistance(m: number): string {
		if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
		return `${Math.round(m)} m`;
	}

	// Merge ghost players into the player list for ghost races
	function getAllPlayers(): Player[] {
		if (!raceState.isGhostRace) return raceState.players;

		const combined: Player[] = [...raceState.players];
		for (const gp of raceState.ghostPlayers) {
			if (!combined.find((p) => p.id === gp.id)) {
				combined.push({
					id: gp.id,
					name: gp.name,
					distance: gp.distance,
					ready: true,
					finished: gp.finished,
					finishOrder: null
				});
			}
		}
		return combined;
	}

	// Live sorted order — this is reactive and updates immediately
	const liveSortedIds = $derived(
		[...getAllPlayers()]
			.sort((a, b) => b.distance - a.distance)
			.map((p) => p.id)
	);

	// Debounced display order — only commits every 2s to avoid constant flipping
	let sortedIds = $state<string[]>([]);
	let sortTimer: ReturnType<typeof setTimeout> | null = null;
	let initialized = false;

	$effect(() => {
		const newIds = liveSortedIds;

		if (!initialized) {
			// First render: apply immediately
			sortedIds = newIds;
			initialized = true;
			return;
		}

		// Check if order actually changed
		const changed = newIds.length !== sortedIds.length || newIds.some((id, i) => sortedIds[i] !== id);
		if (!changed) return;

		if (sortTimer) clearTimeout(sortTimer);
		sortTimer = setTimeout(() => {
			flipAnimate(newIds);
		}, 2000);
	});

	let playersEl: HTMLDivElement;

	async function flipAnimate(newIds: string[]) {
		if (!playersEl) {
			sortedIds = newIds;
			return;
		}

		// FIRST: record current positions
		const cards = playersEl.querySelectorAll<HTMLElement>('[data-player-id]');
		const firstRects = new Map<string, DOMRect>();
		cards.forEach((el) => {
			firstRects.set(el.dataset.playerId!, el.getBoundingClientRect());
		});

		// Update order
		sortedIds = newIds;
		await tick();

		// LAST: record new positions and INVERT+PLAY
		const updatedCards = playersEl.querySelectorAll<HTMLElement>('[data-player-id]');
		updatedCards.forEach((el) => {
			const id = el.dataset.playerId!;
			const first = firstRects.get(id);
			if (!first) return;
			const last = el.getBoundingClientRect();
			const dy = first.top - last.top;
			if (Math.abs(dy) < 1) return;

			el.animate(
				[
					{ transform: `translateY(${dy}px)` },
					{ transform: 'translateY(0)' }
				],
				{ duration: 300, easing: 'ease-out' }
			);
		});
	}

	// Players in debounced sort order
	const displayPlayers = $derived(
		sortedIds
			.map((id) => getAllPlayers().find((p) => p.id === id))
			.filter((p): p is NonNullable<typeof p> => p != null)
	);
</script>

<div class="race-view">
	<div class="race-header">
		<div class="my-distance">
			<span class="big">{formatDistance(raceState.myDistance)}</span>
			<span class="target">/ {formatDistance(raceState.targetDistance)}</span>
		</div>
		<GpsStatus />
	</div>

	<div class="players" bind:this={playersEl}>
		{#each displayPlayers as player (player.id)}
			<div data-player-id={player.id}>
				<PlayerCard {player} />
			</div>
		{/each}
	</div>

	<ChatPanel />
</div>

<style>
	.race-view {
		display: flex;
		flex-direction: column;
		gap: 16px;
		flex: 1;
		min-height: 0;
	}

	.race-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: 8px 0;
	}

	.my-distance {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.big {
		font-size: 2rem;
		font-weight: 800;
		color: var(--accent);
		font-variant-numeric: tabular-nums;
	}

	.target {
		color: var(--text-muted);
		font-size: 1rem;
	}

	.players {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex-shrink: 0;
	}

</style>
