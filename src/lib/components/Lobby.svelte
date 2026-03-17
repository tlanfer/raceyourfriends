<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/webrtc/signaling.js';
	import ChatPanel from './ChatPanel.svelte';

	let copied = $state(false);

	function toggleReady() {
		const myPlayer = raceState.myPlayer;
		if (!myPlayer) return;
		const newReady = !myPlayer.ready;
		raceState.setPlayerReady(raceState.myId, newReady);
		signaling.send({ type: 'ready', ready: newReady });
	}

	function startRace() {
		signaling.send({ type: 'start-race' });
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
</script>

<div class="lobby">
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
		</div>
		<div class="actions">
			<button
				class="btn btn-secondary btn-sm"
				onclick={toggleReady}
			>
				{raceState.myPlayer?.ready ? 'Unready' : 'Ready Up'}
			</button>
			{#if raceState.isOwner}
				<button
					class="btn btn-start btn-sm"
					onclick={startRace}
					disabled={raceState.players.length < 2}
				>
					Start Race
				</button>
			{/if}
		</div>
	</div>

	<div class="players">
		{#each raceState.players as player}
			<div class="player-chip" class:ready={player.ready}>
				{player.name}
				{#if player.id === raceState.myId}<span class="you">(you)</span>{/if}
				{#if player.ready}<span class="ready-dot"></span>{/if}
			</div>
		{/each}
	</div>

	<ChatPanel />
</div>

<style>
	.lobby {
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

	.actions {
		display: flex;
		gap: 8px;
	}

	.actions .btn {
		flex: 1;
	}

	.btn-sm {
		padding: 10px 16px;
		font-size: 0.9rem;
	}

	.btn-start {
		background: var(--accent);
		color: white;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.btn-start:hover {
		opacity: 0.9;
	}

	.players {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 0 2px;
	}

	.player-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		background: var(--bg-card);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.player-chip.ready {
		border-color: #4ade80;
	}

	.ready-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #4ade80;
	}

	.you {
		color: var(--text-muted);
		font-weight: 400;
		font-size: 0.75rem;
	}
</style>
