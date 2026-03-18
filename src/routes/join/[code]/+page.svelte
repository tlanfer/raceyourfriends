<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { isValidRaceCode } from '$lib/utils/race-code.js';
	import { signaling } from '$lib/signaling.js';
	import NameInput from '$lib/components/NameInput.svelte';

	const code = $derived(($page.params.code ?? '').toUpperCase());
	const validCode = $derived(isValidRaceCode(code));

	let error = $state('');
	let joining = $state(false);

	function joinRace() {
		if (!raceState.playerName.trim()) {
			error = 'Enter a name first';
			return;
		}
		if (!validCode) {
			error = 'Invalid race code';
			return;
		}
		joining = true;
		error = '';

		signaling.clearHandlers();
		signaling.connect();
		signaling.on('connected', (msg) => {
			raceState.myId = msg.id;
			signaling.send({
				type: 'join-race',
				code,
				name: raceState.playerName
			});
		});
		signaling.on('race-joined', (msg) => {
			raceState.raceCode = msg.code;
			raceState.raceName = msg.raceName;
			raceState.targetDistance = msg.targetDistance;
			raceState.isOwner = false;
			raceState.phase = 'lobby';
			raceState.players = [];
			for (const p of msg.players) {
				raceState.addPlayer({ ...p, distance: 0, finished: false, finishOrder: null });
			}
			if (msg.messages) {
				raceState.messages = msg.messages;
			}
			goto(`/race/${msg.code}`);
		});
		signaling.on('ghost-race-joined', (msg) => {
			raceState.raceCode = msg.code;
			raceState.raceName = msg.raceName;
			raceState.targetDistance = msg.targetDistance;
			raceState.isGhostRace = true;
			raceState.ghostExpiresAt = msg.expiresAt;
			raceState.ghostRuns = msg.runs || [];
			raceState.isOwner = false;
			raceState.phase = 'lobby';
			raceState.myPersonalPhase = 'waiting';
			if (msg.messages) {
				raceState.messages = msg.messages;
			}
			goto(`/race/${msg.code}`);
		});
		signaling.on('error', (msg) => {
			error = msg.message;
			joining = false;
		});
	}
</script>

<div class="page">
	<header>
		<h1>Join Race</h1>
	</header>

	<main>
		<NameInput />

		<div class="code-display card">
			<span class="label">Race Code</span>
			<span class="code">{code || '----'}</span>
		</div>

		<button
			class="btn btn-primary"
			onclick={joinRace}
			disabled={!validCode || !raceState.playerName.trim() || joining}
		>
			{joining ? 'Joining...' : 'Join Race'}
		</button>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<a href="/" class="back">Back to home</a>
	</main>
</div>

<style>
	header {
		text-align: center;
		padding: 32px 0 24px;
	}

	h1 {
		font-size: 1.6rem;
		font-weight: 800;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 20px;
		flex: 1;
	}

	.code-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 24px;
	}

	.label {
		font-size: 0.8rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.code {
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: 0.15em;
		color: var(--accent);
	}

	.btn {
		width: 100%;
	}

	.error {
		color: var(--accent);
		font-size: 0.9rem;
		text-align: center;
	}

	.back {
		text-align: center;
		color: var(--text-muted);
		font-size: 0.9rem;
	}
</style>
