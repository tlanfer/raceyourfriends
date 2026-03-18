<script lang="ts">
	import NameInput from '$lib/components/NameInput.svelte';
	import RaceSetup from '$lib/components/RaceSetup.svelte';
</script>

<div class="page">
	<header>
		<img src="/icon.png" alt="Race Your Friends" class="logo" />
	</header>

	<main>
		<NameInput />
		<RaceSetup />
	</main>
</div>

<style>
	header {
		text-align: center;
		padding: 16px 0 12px;
	}

	.logo {
		width: 180px;
		height: auto;
	}

	main {
		display: flex;
		flex-direction: column;
		gap: 24px;
		flex: 1;
	}
</style>
