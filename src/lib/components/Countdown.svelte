<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';
	import { playCountdownBeep } from '$lib/utils/sounds.js';

	let secondsLeft = $state(10);
	let timer: ReturnType<typeof setInterval> | null = null;
	let lastBeep = -1;
	let stuckAtZero = $state(false);
	let stuckTimer: ReturnType<typeof setTimeout> | null = null;

	function cancel() {
		if (raceState.isGhostRace) {
			signaling.send({ type: 'ghost-cancel-countdown' });
			raceState.myPersonalPhase = 'waiting';
			raceState.startTime = null;
		} else {
			signaling.send({ type: 'cancel-countdown' });
		}
	}

	function leaveRace() {
		signaling.disconnect();
		raceState.reset();
		goto('/');
	}

	function updateCountdown() {
		if (!raceState.startTime) return;
		const remaining = Math.ceil((raceState.startTime - Date.now()) / 1000);
		secondsLeft = Math.max(0, remaining);

		if (secondsLeft >= 1 && secondsLeft <= 3 && secondsLeft !== lastBeep) {
			lastBeep = secondsLeft;
			playCountdownBeep();
		}

		// Detect stuck at zero (race-started message never arrived)
		if (secondsLeft <= 0 && !stuckTimer) {
			stuckTimer = setTimeout(() => {
				stuckAtZero = true;
			}, 5000);
		} else if (secondsLeft > 0 && stuckTimer) {
			clearTimeout(stuckTimer);
			stuckTimer = null;
			stuckAtZero = false;
		}
	}

	onMount(() => {
		updateCountdown();
		timer = setInterval(updateCountdown, 100);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
		if (stuckTimer) clearTimeout(stuckTimer);
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

		{#if (raceState.isOwner || raceState.isGhostRace) && secondsLeft > 0}
			<button class="btn btn-secondary cancel-btn" onclick={cancel}>Cancel</button>
		{:else if !raceState.isOwner && !raceState.isGhostRace && secondsLeft > 0}
			<button class="btn btn-secondary cancel-btn" onclick={leaveRace}>Leave Race</button>
		{/if}

		{#if stuckAtZero}
			<div class="stuck-notice">
				<p>Something went wrong</p>
				<button class="btn btn-secondary cancel-btn" onclick={leaveRace}>Return Home</button>
			</div>
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

	.stuck-notice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		color: var(--text-muted);
		font-size: 0.9rem;
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
