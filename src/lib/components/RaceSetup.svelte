<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
	import { isValidRaceCode } from '$lib/utils/race-code.js';
	import { generateRaceName } from '$lib/utils/race-names.js';
	import { goto } from '$app/navigation';
	import { signaling } from '$lib/webrtc/signaling.js';

	let joinCode = $state('');
	let raceName = $state(generateRaceName());
	let customDistance = $state('');
	let error = $state('');

	const DISTANCES = [1000, 2000, 5000, 10_000, 15_000, 20_000];
	const isPreset = $derived(DISTANCES.includes(raceState.targetDistance));

	function setCustomDistance(value: string) {
		customDistance = value;
		const km = parseFloat(value);
		if (km > 0) {
			raceState.setTargetDistance(Math.round(km * 1000));
		}
	}

	function selectPreset(d: number) {
		customDistance = '';
		raceState.setTargetDistance(d);
	}

	function randomizeName() {
		raceName = generateRaceName();
	}

	function createRace() {
		if (!raceState.playerName.trim()) {
			error = 'Enter your name first';
			return;
		}
		if (!raceName.trim()) {
			error = 'Enter a race name';
			return;
		}
		error = '';
		signaling.clearHandlers();
		signaling.connect();
		signaling.on('connected', (msg) => {
			raceState.myId = msg.id;
			signaling.send({
				type: 'create-race',
				name: raceState.playerName,
				raceName: raceName.trim(),
				targetDistance: raceState.targetDistance
			});
		});
		signaling.on('race-created', (msg) => {
			raceState.raceCode = msg.code;
			raceState.raceName = msg.raceName;
			raceState.isOwner = true;
			raceState.phase = 'lobby';
			for (const p of msg.players) {
				raceState.addPlayer({ ...p, distance: 0, finished: false, finishOrder: null });
			}
			goto(`/race/${msg.code}`);
		});
		signaling.on('error', (msg) => {
			error = msg.message;
		});
	}

	function joinRace() {
		const code = joinCode.toUpperCase().trim();
		if (!raceState.playerName.trim()) {
			error = 'Enter your name first';
			return;
		}
		if (!isValidRaceCode(code)) {
			error = 'Invalid race code';
			return;
		}
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
		signaling.on('error', (msg) => {
			error = msg.message;
		});
	}

	function formatDistance(m: number): string {
		return m >= 1000 ? `${m / 1000} km` : `${m} m`;
	}
</script>

<div class="setup">
	<div class="section">
		<h2>Race Name</h2>
		<div class="input-row">
			<input
				class="input"
				type="text"
				placeholder="Name your race..."
				bind:value={raceName}
				maxlength={30}
			/>
			<button class="btn btn-secondary dice-btn" onclick={randomizeName} title="Random name">
				🎲
			</button>
		</div>
	</div>

	<div class="section">
		<h2>Race Distance</h2>
		<div class="distance-grid">
			{#each DISTANCES as d}
				<button
					class="btn distance-btn"
					class:active={raceState.targetDistance === d && !customDistance}
					onclick={() => selectPreset(d)}
				>
					{formatDistance(d)}
				</button>
			{/each}
		</div>
		<div class="custom-distance">
			<input
				class="input"
				type="number"
				placeholder="Custom (km)"
				step="0.1"
				min="0.1"
				value={customDistance}
				oninput={(e) => setCustomDistance(e.currentTarget.value)}
			/>
			{#if customDistance && !isPreset}
				<span class="custom-label">{formatDistance(raceState.targetDistance)}</span>
			{/if}
		</div>
	</div>

	<div class="section">
		<button class="btn btn-primary full" onclick={createRace} disabled={!raceState.playerName.trim()}>
			Create Race
		</button>
	</div>

	<div class="divider">
		<span>or join</span>
	</div>

	<div class="section join-row">
		<input
			class="input code-input"
			type="text"
			placeholder="CODE"
			maxlength={4}
			bind:value={joinCode}
			oninput={(e) => (joinCode = e.currentTarget.value.toUpperCase())}
		/>
		<button
			class="btn btn-secondary"
			onclick={joinRace}
			disabled={!raceState.playerName.trim() || joinCode.length < 4}
		>
			Join
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	h2 {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.input-row {
		display: flex;
		gap: 8px;
	}

	.input-row .input {
		flex: 1;
	}

	.dice-btn {
		padding: 12px 14px;
		flex-shrink: 0;
	}

	.distance-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.distance-btn {
		padding: 10px;
		font-size: 0.9rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: var(--radius);
	}

	.distance-btn.active {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.custom-distance {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.custom-distance .input {
		flex: 1;
	}

	.custom-label {
		font-size: 0.85rem;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.full {
		width: 100%;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: rgba(255, 255, 255, 0.1);
	}

	.join-row {
		flex-direction: row;
		gap: 8px;
	}

	.code-input {
		flex: 1;
		text-align: center;
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.error {
		color: var(--accent);
		font-size: 0.9rem;
		text-align: center;
	}
</style>
