<script lang="ts">
	import { tick } from 'svelte';
	import { raceState } from '$lib/stores/race.svelte.js';
	import { signaling } from '$lib/signaling.js';
	import { playChatBlip } from '$lib/utils/sounds.js';

	const EMOTES = ['🏃', '💨', '🔥', '😤', '💀', '🥵', '😂', '👋', '💪', '🏆'];

	let inputText = $state('');
	let messagesEl: HTMLDivElement;
	let lastMessageCount = $state(0);

	$effect(() => {
		const count = raceState.messages.length;
		if (count > lastMessageCount) {
			if (lastMessageCount > 0) {
				playChatBlip();
			}
			tick().then(() => scrollToBottom());
		}
		lastMessageCount = count;
	});

	function scrollToBottom() {
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	}

	function sendChat() {
		const text = inputText.trim();
		if (!text) return;
		signaling.send({ type: 'chat-message', text });
		inputText = '';
	}

	function sendEmote(emote: string) {
		signaling.send({ type: 'emote', emote });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendChat();
		}
	}
</script>

<div class="chat-panel card">
	<div class="messages" bind:this={messagesEl}>
		{#each raceState.messages as msg (msg.id)}
			<div class="msg" class:emote={msg.type === 'emote'} class:mine={msg.senderId === raceState.myId}>
				<span class="msg-name">{msg.senderName}:</span>
				{#if msg.type === 'emote'}
					<span class="msg-emote">{msg.text}</span>
				{:else}
					<span class="msg-text">{msg.text}</span>
				{/if}
			</div>
		{/each}
		{#if raceState.messages.length === 0}
			<div class="empty">No messages yet</div>
		{/if}
	</div>

	<div class="emote-row">
		{#each EMOTES as emote}
			<button class="emote-btn" onclick={() => sendEmote(emote)}>{emote}</button>
		{/each}
	</div>

	<div class="input-row">
		<input
			class="input chat-input"
			type="text"
			placeholder="Type a message..."
			bind:value={inputText}
			onkeydown={handleKeydown}
			maxlength="200"
		/>
		<button class="btn btn-primary send-btn" onclick={sendChat} disabled={!inputText.trim()}>
			Send
		</button>
	</div>
</div>

<style>
	.chat-panel {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 8px 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-height: 60px;
	}

	.msg {
		font-size: 0.85rem;
		padding: 2px 0;
		word-break: break-word;
	}

	.msg-name {
		font-weight: 600;
		color: var(--text-muted);
		margin-right: 4px;
	}

	.msg-text {
		color: var(--text);
	}

	.msg.emote .msg-emote {
		font-size: 1.5rem;
		vertical-align: middle;
	}

	.msg.mine .msg-name {
		color: var(--accent);
	}

	.empty {
		color: var(--text-muted);
		font-size: 0.8rem;
		text-align: center;
		padding: 16px 0;
		margin: auto 0;
	}

	.emote-row {
		display: flex;
		gap: 4px;
		padding: 8px 0;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		flex-wrap: wrap;
		justify-content: center;
	}

	.emote-btn {
		font-size: 1.3rem;
		padding: 4px 6px;
		border-radius: 8px;
		transition: background 0.15s;
	}

	.emote-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.input-row {
		display: flex;
		gap: 8px;
		padding-top: 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.chat-input {
		flex: 1;
		padding: 10px 12px;
	}

	.send-btn {
		padding: 10px 16px;
		font-size: 0.85rem;
		white-space: nowrap;
	}
</style>
