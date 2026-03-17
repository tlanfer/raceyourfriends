<script lang="ts">
	let { onAccept }: { onAccept: () => void } = $props();
</script>

<div class="overlay">
	<div class="modal card">
		<h2>GPS Permission Required</h2>
		<p>
			This app uses your GPS to measure <strong>distance only</strong>. Your actual location is
			never shared — only the total distance you've run is sent to other players.
		</p>
		<button class="btn btn-primary" onclick={onAccept}>Allow GPS Access</button>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		z-index: 100;
	}

	.modal {
		max-width: 360px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		text-align: center;
	}

	h2 {
		font-size: 1.2rem;
	}

	p {
		color: var(--text-muted);
		font-size: 0.95rem;
		line-height: 1.5;
	}
</style>
