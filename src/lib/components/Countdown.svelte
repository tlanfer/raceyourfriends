<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/webrtc/signaling.js';

	function cancel() {
		signaling.send({ type: 'cancel-countdown' });
	}
</script>

<div class="countdown-overlay">
	<div class="content">
		<div class="number" class:go={raceState.countdownValue <= 0}>
			{#if raceState.countdownValue > 0}
				{raceState.countdownValue}
			{:else}
				GO!
			{/if}
		</div>

		{#if raceState.isOwner && raceState.countdownValue > 0}
			<button class="btn btn-secondary cancel-btn" onclick={cancel}>Cancel</button>
		{/if}
	</div>
</div>

<style>
	.countdown-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
	}

	.number {
		font-size: 8rem;
		font-weight: 900;
		color: var(--text);
		animation: pulse 0.5s ease-out;
	}

	.number.go {
		color: var(--accent);
		font-size: 6rem;
	}

	.cancel-btn {
		font-size: 1rem;
		padding: 12px 32px;
	}

	@keyframes pulse {
		0% {
			transform: scale(1.5);
			opacity: 0.5;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
