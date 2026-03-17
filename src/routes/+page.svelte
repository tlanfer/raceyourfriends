<script lang="ts">
	import NameInput from '$lib/components/NameInput.svelte';
	import RaceSetup from '$lib/components/RaceSetup.svelte';
</script>

<div class="page">
	<header>
		<h1>Race<span class="accent">Your</span>Friends</h1>
		<p class="tagline">GPS racing. Anywhere. Against anyone.</p>
	</header>

	<main>
		<NameInput />
		<RaceSetup />
	</main>
</div>

<style>
	header {
		text-align: center;
		padding: 32px 0 24px;
	}

	h1 {
		font-size: 2rem;
		font-weight: 900;
		letter-spacing: -0.02em;
	}

	.accent {
		color: var(--accent);
	}

	.tagline {
		color: var(--text-muted);
		font-size: 0.95rem;
		margin-top: 6px;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 24px;
		flex: 1;
	}
</style>
