<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { KeepAwake } from '@capacitor-community/keep-awake';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';
	import { GeoTracker } from '$lib/geo/tracker.js';
	import { playGoSound, playFinishSound } from '$lib/utils/sounds.js';
	import Lobby from '$lib/components/Lobby.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import RaceView from '$lib/components/RaceView.svelte';
	import FinishLine from '$lib/components/FinishLine.svelte';
	import PrivacyNotice from '$lib/components/PrivacyNotice.svelte';

	let showPrivacy = $state(typeof localStorage !== 'undefined' ? !localStorage.getItem('privacyAccepted') : true);
	let gpsGranted = $state(false);
	let tracker: GeoTracker | null = null;
	let lastDistanceSend = 0;

	onMount(() => {
		// If no race code in state, redirect home
		if (!raceState.raceCode) {
			goto('/');
			return;
		}

		setupSignalingListeners();
	});

	onDestroy(() => {
		tracker?.stop();
		KeepAwake.allowSleep().catch(() => {});
	});

	function setupSignalingListeners() {
		signaling.clearHandlers();

		signaling.on('player-joined', (msg) => {
			raceState.players = [];
			for (const p of msg.players) {
				raceState.addPlayer({ ...p, distance: 0, finished: false, finishOrder: null });
			}
		});

		signaling.on('player-left', (msg) => {
			raceState.removePlayer(msg.playerId);
		});

		signaling.on('player-ready', (msg) => {
			raceState.setPlayerReady(msg.playerId, msg.ready);
		});

		signaling.on('countdown-start', (msg) => {
			raceState.startTime = msg.startTime;
			raceState.phase = 'countdown';
		});

		signaling.on('countdown-cancelled', () => {
			raceState.phase = 'lobby';
		});

		signaling.on('race-started', () => {
			playGoSound();
			raceState.phase = 'racing';
			startTracking();
		});

		signaling.on('race-distances', (msg) => {
			for (const p of msg.players) {
				raceState.updatePlayerDistance(p.id, p.distance);
				if (p.finished) raceState.markPlayerFinished(p.id);
			}
		});

		signaling.on('player-finished', (msg) => {
			raceState.markPlayerFinished(msg.playerId);
		});

		signaling.on('chat-message', (msg) => {
			raceState.addMessage({
				id: msg.id,
				senderId: msg.senderId,
				senderName: msg.senderName,
				type: msg.messageType ?? 'chat',
				text: msg.text,
				timestamp: msg.timestamp
			});
		});

		signaling.on('emote', (msg) => {
			raceState.addMessage({
				id: msg.id,
				senderId: msg.senderId,
				senderName: msg.senderName,
				type: msg.messageType ?? 'emote',
				text: msg.text,
				timestamp: msg.timestamp
			});
		});
	}

	function acceptPrivacy() {
		showPrivacy = false;
		localStorage.setItem('privacyAccepted', '1');
		// On web, request GPS permission now so it's ready when the race starts.
		// On native, BackgroundGeolocation.start() handles permission requests.
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				() => { gpsGranted = true; },
				() => { /* User denied — they'll get prompted again on race start */ },
				{ enableHighAccuracy: true }
			);
		}
	}

	async function startTracking() {
		// Keep screen awake during the race
		KeepAwake.keepAwake().catch(() => {});

		tracker = new GeoTracker();
		tracker.onUpdate((state) => {
			raceState.myDistance = state.totalDistance;
			raceState.gpsAccuracy = state.accuracy;
			raceState.gpsHasSignal = state.hasSignal;

			// Update my own player
			raceState.updatePlayerDistance(raceState.myId, state.totalDistance);

			// Send distance update, throttled to at most once per 5 seconds
			const now = Date.now();
			if (now - lastDistanceSend >= 5000) {
				lastDistanceSend = now;
				signaling.send({ type: 'distance', distance: state.totalDistance });
			}

			// Check finish
			if (state.totalDistance >= raceState.targetDistance && !raceState.myPlayer?.finished) {
				raceState.markPlayerFinished(raceState.myId);
				playFinishSound();
				signaling.send({ type: 'finished' });

				// Show finish screen after a moment
				setTimeout(() => {
					raceState.phase = 'finished';
					tracker?.stop();
				}, 1500);
			}
		});
		await tracker.start();
	}
</script>

<div class="page">
	{#if raceState.phase === 'lobby'}
		<Lobby />
	{:else if raceState.phase === 'countdown'}
		<Countdown />
	{:else if raceState.phase === 'racing'}
		<RaceView />
	{:else if raceState.phase === 'finished'}
		<FinishLine />
	{/if}

	{#if showPrivacy}
		<PrivacyNotice onAccept={acceptPrivacy} />
	{/if}
</div>
