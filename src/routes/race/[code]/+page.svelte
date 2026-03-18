<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { KeepAwake } from '@capacitor-community/keep-awake';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';
	import { GeoTracker } from '$lib/geo/tracker.js';
	import { GhostPlayback } from '$lib/ghost/playback.js';
	import { playGoSound, playFinishSound } from '$lib/utils/sounds.js';
	import Lobby from '$lib/components/Lobby.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import RaceView from '$lib/components/RaceView.svelte';
	import FinishLine from '$lib/components/FinishLine.svelte';
	import GhostLobby from '$lib/components/GhostLobby.svelte';
	import GhostFinishLine from '$lib/components/GhostFinishLine.svelte';
	import PrivacyNotice from '$lib/components/PrivacyNotice.svelte';

	let showPrivacy = $state(typeof localStorage !== 'undefined' ? !localStorage.getItem('privacyAccepted') : true);
	let gpsGranted = $state(false);
	let tracker: GeoTracker | null = null;
	let ghostPlayback: GhostPlayback | null = null;
	let lastDistanceSend = 0;

	onMount(() => {
		// If no race code in state, redirect home
		if (!raceState.raceCode) {
			goto('/');
			return;
		}

		if (raceState.isGhostRace) {
			setupGhostSignalingListeners();
		} else {
			setupSignalingListeners();
		}
	});

	onDestroy(() => {
		tracker?.stop();
		ghostPlayback?.stop();
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

		setupChatListeners();
	}

	function setupGhostSignalingListeners() {
		signaling.clearHandlers();

		signaling.on('ghost-countdown-start', (msg) => {
			raceState.startTime = msg.startTime;
			raceState.ghostPersonalStartTime = msg.startTime;
			raceState.myPersonalPhase = 'countdown';
		});

		signaling.on('ghost-race-started', (msg) => {
			playGoSound();
			raceState.ghostPlaybackData = msg.ghostRuns || [];
			raceState.myPersonalPhase = 'racing';
			startGhostTracking();
		});

		signaling.on('ghost-run-sample', (msg) => {
			if (ghostPlayback) {
				ghostPlayback.addSample(msg.runnerId, {
					elapsed_ms: msg.elapsed_ms,
					distance: msg.distance
				});
			}
		});

		signaling.on('ghost-run-distances', (msg) => {
			// Update live runner distances in ghost players list
			for (const p of msg.players) {
				const existing = raceState.ghostPlayers.find((gp) => gp.id === p.id);
				if (existing) {
					existing.distance = p.distance;
				}
			}
		});

		signaling.on('ghost-run-complete', (msg) => {
			const run = msg.run;
			// Add to ghostRuns if not already there
			if (!raceState.ghostRuns.find((r) => r.runnerId === run.runnerId && r.startedAt === run.startedAt)) {
				raceState.ghostRuns = [...raceState.ghostRuns, run];
			}
		});

		signaling.on('ghost-runner-starting', () => {
			// Could show a notification, but for now just ignore
		});

		signaling.on('player-joined', (msg) => {
			// Ghost lobby: just track connected players for chat
		});

		signaling.on('player-left', (msg) => {
			// Ghost lobby: player disconnected
		});

		signaling.on('error', (msg) => {
			console.error('[ghost]', msg.message);
		});

		setupChatListeners();
	}

	function setupChatListeners() {
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
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				() => { gpsGranted = true; },
				() => {},
				{ enableHighAccuracy: true }
			);
		}
	}

	async function startTracking() {
		KeepAwake.keepAwake().catch(() => {});

		tracker = new GeoTracker();
		tracker.onUpdate((state) => {
			raceState.myDistance = state.totalDistance;
			raceState.gpsAccuracy = state.accuracy;
			raceState.gpsHasSignal = state.hasSignal;

			raceState.updatePlayerDistance(raceState.myId, state.totalDistance);

			const now = Date.now();
			if (now - lastDistanceSend >= 5000) {
				lastDistanceSend = now;
				signaling.send({ type: 'distance', distance: state.totalDistance });
			}

			if (state.totalDistance >= raceState.targetDistance && !raceState.myPlayer?.finished) {
				raceState.markPlayerFinished(raceState.myId);
				playFinishSound();
				signaling.send({ type: 'finished' });

				setTimeout(() => {
					raceState.phase = 'finished';
					tracker?.stop();
				}, 1500);
			}
		});
		await tracker.start();
	}

	async function startGhostTracking() {
		KeepAwake.keepAwake().catch(() => {});

		// Initialize ghost playback
		ghostPlayback = new GhostPlayback(
			raceState.ghostPlaybackData,
			(players) => {
				raceState.ghostPlayers = players;
			}
		);
		ghostPlayback.start();

		// Add self to players list
		raceState.players = [];
		raceState.addPlayer({
			id: raceState.myId,
			name: raceState.playerName,
			distance: 0,
			ready: true,
			finished: false,
			finishOrder: null
		});

		tracker = new GeoTracker();
		tracker.onUpdate((state) => {
			raceState.myDistance = state.totalDistance;
			raceState.gpsAccuracy = state.accuracy;
			raceState.gpsHasSignal = state.hasSignal;

			raceState.updatePlayerDistance(raceState.myId, state.totalDistance);

			const now = Date.now();
			if (now - lastDistanceSend >= 5000) {
				lastDistanceSend = now;
				const elapsed_ms = raceState.ghostPersonalStartTime
					? now - raceState.ghostPersonalStartTime
					: 0;
				signaling.send({
					type: 'ghost-distance',
					distance: state.totalDistance,
					elapsed_ms
				});
			}

			if (state.totalDistance >= raceState.targetDistance && !raceState.myPlayer?.finished) {
				raceState.markPlayerFinished(raceState.myId);
				playFinishSound();
				signaling.send({
					type: 'ghost-finished',
					distance: state.totalDistance
				});

				setTimeout(() => {
					raceState.myPersonalPhase = 'finished';
					tracker?.stop();
					ghostPlayback?.stop();
				}, 1500);
			}
		});
		await tracker.start();
	}
</script>

<div class="page">
	{#if raceState.isGhostRace}
		{#if raceState.myPersonalPhase === 'waiting'}
			<GhostLobby />
		{:else if raceState.myPersonalPhase === 'countdown'}
			<Countdown />
		{:else if raceState.myPersonalPhase === 'racing'}
			<RaceView />
		{:else if raceState.myPersonalPhase === 'finished'}
			<GhostFinishLine />
		{/if}
	{:else}
		{#if raceState.phase === 'lobby'}
			<Lobby />
		{:else if raceState.phase === 'countdown'}
			<Countdown />
		{:else if raceState.phase === 'racing'}
			<RaceView />
		{:else if raceState.phase === 'finished'}
			<FinishLine />
		{/if}
	{/if}

	{#if showPrivacy}
		<PrivacyNotice onAccept={acceptPrivacy} />
	{/if}
</div>
