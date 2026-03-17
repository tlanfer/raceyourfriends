<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
</script>

<div class="gps-status" class:lost={!raceState.gpsHasSignal}>
	<div class="dot"></div>
	<span>
		{#if raceState.gpsHasSignal}
			GPS {raceState.gpsAccuracy ? `±${Math.round(raceState.gpsAccuracy)}m` : ''}
		{:else}
			Signal Lost
		{/if}
	</span>
</div>

<style>
	.gps-status {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #4ade80;
	}

	.lost .dot {
		background: var(--accent);
		animation: blink 1s infinite;
	}

	.lost {
		color: var(--accent);
	}

	@keyframes blink {
		50% {
			opacity: 0.3;
		}
	}
</style>
