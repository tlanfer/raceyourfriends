<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/webrtc/signaling.js';
	import { peerManager } from '$lib/webrtc/peer-manager.js';
	import { handlePeerMessage, startBroadcasting, stopBroadcasting } from '$lib/webrtc/data-channel.js';
	import { GeoTracker } from '$lib/geo/tracker.js';
	import { playCountdownBeep, playGoSound, playFinishSound } from '$lib/utils/sounds.js';
	import Lobby from '$lib/components/Lobby.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import RaceView from '$lib/components/RaceView.svelte';
	import FinishLine from '$lib/components/FinishLine.svelte';
	import PrivacyNotice from '$lib/components/PrivacyNotice.svelte';

	let showPrivacy = $state(typeof localStorage !== 'undefined' ? !localStorage.getItem('privacyAccepted') : true);
	let gpsGranted = $state(false);
	let tracker: GeoTracker | null = null;
	let distanceInterval: ReturnType<typeof setInterval> | null = null;

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
		stopBroadcasting();
		peerManager.destroy();
		if (distanceInterval) clearInterval(distanceInterval);
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

		signaling.on('countdown-start', () => {
			raceState.phase = 'countdown';
			raceState.countdownValue = 10;

			// Setup WebRTC during countdown
			const peerIds = raceState.players.map((p) => p.id);
			peerManager.setMyId(raceState.myId);
			peerManager.onDataChannel((peerId, channel) => {
				channel.onmessage = (e) => handlePeerMessage(peerId, e.data);
			});
			peerManager.startSignaling(peerIds);
		});

		signaling.on('countdown-tick', (msg) => {
			raceState.countdownValue = msg.value;
			if (msg.value > 0 && msg.value <= 3) {
				playCountdownBeep();
			}
		});

		signaling.on('countdown-cancelled', () => {
			raceState.phase = 'lobby';
			peerManager.destroy();
		});

		signaling.on('race-started', () => {
			playGoSound();
			raceState.phase = 'racing';
			startTracking();
			startBroadcasting();

			// Also broadcast distance via WebSocket as fallback
			distanceInterval = setInterval(() => {
				signaling.send({
					type: 'distance',
					distance: raceState.myDistance
				});
			}, 1000);
		});

		signaling.on('player-distance', (msg) => {
			raceState.updatePlayerDistance(msg.playerId, msg.distance);
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
		// Request GPS permission now so it's ready when the race starts
		navigator.geolocation.getCurrentPosition(
			() => { gpsGranted = true; },
			() => { /* User denied — they'll get prompted again on race start */ },
			{ enableHighAccuracy: true }
		);
	}

	function startTracking() {
		tracker = new GeoTracker();
		tracker.onUpdate((state) => {
			raceState.myDistance = state.totalDistance;
			raceState.gpsAccuracy = state.accuracy;
			raceState.gpsHasSignal = state.hasSignal;

			// Update my own player
			raceState.updatePlayerDistance(raceState.myId, state.totalDistance);

			// Check finish
			if (state.totalDistance >= raceState.targetDistance && !raceState.myPlayer?.finished) {
				raceState.markPlayerFinished(raceState.myId);
				playFinishSound();
				signaling.send({ type: 'finished' });
				peerManager.sendToAll(JSON.stringify({ type: 'finished' }));

				// Show finish screen after a moment
				setTimeout(() => {
					raceState.phase = 'finished';
					tracker?.stop();
					stopBroadcasting();
					if (distanceInterval) {
						clearInterval(distanceInterval);
						distanceInterval = null;
					}
				}, 1500);
			}
		});
		tracker.start();
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
