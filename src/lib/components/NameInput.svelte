<script lang="ts">
	import { raceState } from '$lib/stores/race.svelte.js';
</script>

<div class="name-input">
	<label for="name">Your Name</label>
	<input
		id="name"
		class="input"
		type="text"
		placeholder="Enter your name..."
		value={raceState.playerName}
		oninput={(e) => raceState.setPlayerName(e.currentTarget.value)}
		maxlength={20}
	/>
</div>

<style>
	.name-input {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	label {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
</style>
