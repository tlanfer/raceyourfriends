<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';
	import { playCountdownBeep } from '$lib/utils/sounds.js';

	let secondsLeft = $state(10);
	let timer: ReturnType<typeof setInterval> | null = null;
	let lastBeep = -1;

	function cancel() {
		signaling.send({ type: 'cancel-countdown' });
	}

	function updateCountdown() {
		if (!raceState.startTime) return;
		const remaining = Math.ceil((raceState.startTime - Date.now()) / 1000);
		secondsLeft = Math.max(0, remaining);

		if (secondsLeft >= 1 && secondsLeft <= 3 && secondsLeft !== lastBeep) {
			lastBeep = secondsLeft;
			playCountdownBeep();
		}
	}

	onMount(() => {
		updateCountdown();
		timer = setInterval(updateCountdown, 100);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<div class="countdown-overlay">
	<div class="content">
		<div class="number" class:go={secondsLeft <= 0}>
			{#if secondsLeft > 0}
				{secondsLeft}
			{:else}
				GO!
			{/if}
		</div>

		{#if raceState.isOwner && secondsLeft > 0}
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
