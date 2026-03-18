<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';

	let showHomeButton = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	function startTimer() {
		if (timer) clearTimeout(timer);
		showHomeButton = false;
		timer = setTimeout(() => {
			showHomeButton = true;
		}, 10_000);
	}

	function goHome() {
		signaling.disconnect();
		raceState.reset();
		goto('/');
	}

	$effect(() => {
		if (!raceState.connected) {
			startTimer();
		} else {
			if (timer) clearTimeout(timer);
			showHomeButton = false;
		}
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

{#if !raceState.connected}
	<div class="connection-banner">
		<div class="banner-content">
			<span class="spinner"></span>
			<span>Connection lost — reconnecting...</span>
		</div>
		{#if showHomeButton}
			<button class="btn-home" onclick={goHome}>Return Home</button>
		{/if}
	</div>
{/if}

<style>
	.connection-banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: rgba(239, 68, 68, 0.9);
		backdrop-filter: blur(8px);
		padding: 10px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		color: white;
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.btn-home {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.4);
		border-radius: 6px;
		color: white;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 5px 12px;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-home:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
