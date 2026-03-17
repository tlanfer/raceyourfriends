<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { raceState, type RacePhase } from '$lib/stores/race.svelte.js';
	import Lobby from '$lib/components/Lobby.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import RaceView from '$lib/components/RaceView.svelte';
	import FinishLine from '$lib/components/FinishLine.svelte';

	const FAKE_PLAYERS = [
		{ id: 'me', name: 'You' },
		{ id: 'alice', name: 'Alice' },
		{ id: 'bob', name: 'Bob' },
		{ id: 'carol', name: 'Carol' }
	];

	const CHAT_LINES = [
		{ senderId: 'alice', senderName: 'Alice', type: 'chat' as const, text: 'good luck everyone!' },
		{ senderId: 'bob', senderName: 'Bob', type: 'emote' as const, text: '🔥' },
		{ senderId: 'carol', senderName: 'Carol', type: 'chat' as const, text: 'ready to lose? 😂' },
		{ senderId: 'alice', senderName: 'Alice', type: 'emote' as const, text: '💪' },
		{ senderId: 'bob', senderName: 'Bob', type: 'chat' as const, text: 'lets gooo' },
		{ senderId: 'carol', senderName: 'Carol', type: 'emote' as const, text: '🏃' },
		{ senderId: 'alice', senderName: 'Alice', type: 'chat' as const, text: 'bob is catching up!' },
		{ senderId: 'bob', senderName: 'Bob', type: 'emote' as const, text: '💨' },
		{ senderId: 'carol', senderName: 'Carol', type: 'chat' as const, text: 'my legs are dying' },
		{ senderId: 'alice', senderName: 'Alice', type: 'emote' as const, text: '🥵' },
		{ senderId: 'bob', senderName: 'Bob', type: 'chat' as const, text: 'overtook carol!!' },
		{ senderId: 'carol', senderName: 'Carol', type: 'emote' as const, text: '💀' },
	];

	// Speed profiles: base m/s with some variance
	const speeds: Record<string, { base: number; variance: number }> = {
		me:    { base: 3.2, variance: 0.8 },
		alice: { base: 3.5, variance: 0.6 },
		bob:   { base: 2.8, variance: 1.2 },
		carol: { base: 3.0, variance: 0.9 }
	};

	let intervals: ReturnType<typeof setInterval>[] = [];
	let timeouts: ReturnType<typeof setTimeout>[] = [];
	let chatIndex = 0;
	let msgIdCounter = 0;

	let currentPhase = $state<RacePhase>('lobby');

	function setupLobby() {
		raceState.reset();
		raceState.myId = 'me';
		raceState.raceCode = 'DEMO';
		raceState.raceName = 'Demo Race';
		raceState.targetDistance = 2000;
		raceState.isOwner = true;
		raceState.phase = 'lobby';
		currentPhase = 'lobby';

		// Add players with staggered joins
		raceState.addPlayer({ id: 'me', name: 'You', distance: 0, ready: false, finished: false, finishOrder: null });

		timeouts.push(setTimeout(() => {
			raceState.addPlayer({ id: 'alice', name: 'Alice', distance: 0, ready: false, finished: false, finishOrder: null });
			addChat(CHAT_LINES[0]);
		}, 1000));

		timeouts.push(setTimeout(() => {
			raceState.addPlayer({ id: 'bob', name: 'Bob', distance: 0, ready: false, finished: false, finishOrder: null });
		}, 2000));

		timeouts.push(setTimeout(() => {
			raceState.addPlayer({ id: 'carol', name: 'Carol', distance: 0, ready: false, finished: false, finishOrder: null });
			addChat(CHAT_LINES[1]);
		}, 3000));

		// Players ready up
		timeouts.push(setTimeout(() => raceState.setPlayerReady('alice', true), 4000));
		timeouts.push(setTimeout(() => raceState.setPlayerReady('bob', true), 5000));
		timeouts.push(setTimeout(() => {
			raceState.setPlayerReady('carol', true);
			addChat(CHAT_LINES[2]);
		}, 5500));
		timeouts.push(setTimeout(() => raceState.setPlayerReady('me', true), 6000));
	}

	function startCountdown() {
		raceState.phase = 'countdown';
		currentPhase = 'countdown';
		raceState.countdownValue = 5;

		const countdownInterval = setInterval(() => {
			raceState.countdownValue--;
			if (raceState.countdownValue <= 0) {
				clearInterval(countdownInterval);
				startRacing();
			}
		}, 1000);
		intervals.push(countdownInterval);
	}

	function startRacing() {
		raceState.phase = 'racing';
		currentPhase = 'racing';
		raceState.gpsHasSignal = true;
		raceState.gpsAccuracy = 3;
		chatIndex = 3; // Start from racing chat lines

		// Distance simulation
		const distInterval = setInterval(() => {
			for (const p of FAKE_PLAYERS) {
				const player = raceState.players.find((pl) => pl.id === p.id);
				if (!player || player.finished) continue;

				const s = speeds[p.id];
				const delta = s.base + (Math.random() - 0.5) * s.variance * 2;
				const newDist = Math.min(player.distance + delta, raceState.targetDistance);
				raceState.updatePlayerDistance(p.id, newDist);
				if (p.id === 'me') raceState.myDistance = newDist;

				if (newDist >= raceState.targetDistance) {
					raceState.markPlayerFinished(p.id);
				}
			}

			// Check if all finished
			if (raceState.allFinished) {
				clearInterval(distInterval);
				timeouts.push(setTimeout(() => {
					raceState.phase = 'finished';
					currentPhase = 'finished';
				}, 1500));
			}
		}, 500);
		intervals.push(distInterval);

		// Drip chat messages during race
		const chatInterval = setInterval(() => {
			if (chatIndex < CHAT_LINES.length) {
				addChat(CHAT_LINES[chatIndex]);
				chatIndex++;
			} else {
				clearInterval(chatInterval);
			}
		}, 3000);
		intervals.push(chatInterval);
	}

	function addChat(line: typeof CHAT_LINES[number]) {
		raceState.addMessage({
			id: `demo-${msgIdCounter++}`,
			senderId: line.senderId,
			senderName: line.senderName,
			type: line.type,
			text: line.text,
			timestamp: Date.now()
		});
	}

	function setPhase(phase: RacePhase) {
		cleanup();
		if (phase === 'lobby') {
			setupLobby();
		} else if (phase === 'countdown') {
			setupLobby();
			// Skip to countdown immediately with all players ready
			timeouts = [];
			for (const p of FAKE_PLAYERS) {
				raceState.addPlayer({ id: p.id, name: p.name, distance: 0, ready: true, finished: false, finishOrder: null });
			}
			startCountdown();
		} else if (phase === 'racing') {
			setupRacingDirectly();
		} else if (phase === 'finished') {
			setupFinishedDirectly();
		}
	}

	function setupRacingDirectly() {
		raceState.reset();
		raceState.myId = 'me';
		raceState.raceCode = 'DEMO';
		raceState.raceName = 'Demo Race';
		raceState.targetDistance = 2000;
		raceState.isOwner = true;
		raceState.phase = 'racing';
		currentPhase = 'racing';
		raceState.gpsHasSignal = true;
		raceState.gpsAccuracy = 3;

		for (const p of FAKE_PLAYERS) {
			const startDist = 200 + Math.random() * 300;
			raceState.addPlayer({ id: p.id, name: p.name, distance: startDist, ready: true, finished: false, finishOrder: null });
			if (p.id === 'me') raceState.myDistance = startDist;
		}

		chatIndex = 3;

		const distInterval = setInterval(() => {
			for (const p of FAKE_PLAYERS) {
				const player = raceState.players.find((pl) => pl.id === p.id);
				if (!player || player.finished) continue;

				const s = speeds[p.id];
				const delta = s.base + (Math.random() - 0.5) * s.variance * 2;
				const newDist = Math.min(player.distance + delta, raceState.targetDistance);
				raceState.updatePlayerDistance(p.id, newDist);
				if (p.id === 'me') raceState.myDistance = newDist;

				if (newDist >= raceState.targetDistance) {
					raceState.markPlayerFinished(p.id);
				}
			}

			if (raceState.allFinished) {
				clearInterval(distInterval);
				timeouts.push(setTimeout(() => {
					raceState.phase = 'finished';
					currentPhase = 'finished';
				}, 1500));
			}
		}, 500);
		intervals.push(distInterval);

		const chatInterval = setInterval(() => {
			if (chatIndex < CHAT_LINES.length) {
				addChat(CHAT_LINES[chatIndex]);
				chatIndex++;
			} else {
				clearInterval(chatInterval);
			}
		}, 3000);
		intervals.push(chatInterval);
	}

	function setupFinishedDirectly() {
		raceState.reset();
		raceState.myId = 'me';
		raceState.raceCode = 'DEMO';
		raceState.raceName = 'Demo Race';
		raceState.targetDistance = 2000;
		raceState.isOwner = true;
		raceState.phase = 'finished';
		currentPhase = 'finished';

		const order = ['alice', 'me', 'bob', 'carol'];
		for (let i = 0; i < order.length; i++) {
			const p = FAKE_PLAYERS.find((f) => f.id === order[i])!;
			raceState.addPlayer({ id: p.id, name: p.name, distance: 2000, ready: true, finished: true, finishOrder: i + 1 });
		}
		raceState.myDistance = 2000;

		addChat({ senderId: 'alice', senderName: 'Alice', type: 'chat', text: 'gg everyone!' });
		addChat({ senderId: 'bob', senderName: 'Bob', type: 'emote', text: '🏆' });
	}

	function cleanup() {
		intervals.forEach(clearInterval);
		timeouts.forEach(clearTimeout);
		intervals = [];
		timeouts = [];
	}

	onMount(() => {
		setupLobby();
	});

	onDestroy(() => {
		cleanup();
		raceState.reset();
	});
</script>

<div class="demo-controls">
	<span class="demo-label">DEMO</span>
	<button class:active={currentPhase === 'lobby'} onclick={() => setPhase('lobby')}>Lobby</button>
	<button class:active={currentPhase === 'countdown'} onclick={() => setPhase('countdown')}>Countdown</button>
	<button class:active={currentPhase === 'racing'} onclick={() => setPhase('racing')}>Racing</button>
	<button class:active={currentPhase === 'finished'} onclick={() => setPhase('finished')}>Finished</button>
</div>

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
</div>

<style>
	.demo-controls {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		z-index: 200;
		display: flex;
		gap: 4px;
		padding: 6px 10px;
		background: rgba(0, 0, 0, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-top: none;
		border-radius: 0 0 10px 10px;
		align-items: center;
	}

	.demo-label {
		font-size: 0.65rem;
		font-weight: 800;
		color: var(--accent);
		letter-spacing: 0.1em;
		margin-right: 4px;
	}

	.demo-controls button {
		font-size: 0.7rem;
		padding: 4px 10px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-muted);
		font-weight: 600;
		transition: all 0.15s;
	}

	.demo-controls button:hover {
		background: rgba(255, 255, 255, 0.15);
		color: var(--text);
	}

	.demo-controls button.active {
		background: var(--accent);
		color: white;
	}
</style>
