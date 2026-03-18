export function getSpectatorHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Race Your Friends - Spectator</title>
<style>
:root {
	--gray: #E9DFDD;
	--silver: #C7C8C5;
	--crimson: #FF1627;
	--ebony: #131210;
	--black: #000000;
	--bg: var(--ebony);
	--bg-card: var(--black);
	--text: var(--gray);
	--text-muted: var(--silver);
	--accent: var(--crimson);
	--radius: 12px;
	--gap: 16px;
	font-family: system-ui, -apple-system, sans-serif;
	color: var(--text);
	background: var(--bg);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { min-height: 100dvh; -webkit-font-smoothing: antialiased; }
button { font: inherit; color: inherit; cursor: pointer; border: none; background: none; }
input { font: inherit; color: inherit; background: none; border: none; }

.page {
	max-width: 480px;
	margin: 0 auto;
	padding: var(--gap);
	min-height: 100dvh;
	display: flex;
	flex-direction: column;
}
.card {
	background: var(--bg-card);
	border-radius: var(--radius);
	padding: var(--gap);
	border: 1px solid rgba(255,255,255,0.06);
}
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px 28px;
	border-radius: var(--radius);
	font-weight: 700;
	font-size: 1rem;
	transition: opacity 0.15s, transform 0.1s;
	width: 100%;
}
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--accent); color: white; }
.btn-primary:hover { opacity: 0.9; }
.btn:disabled { opacity: 0.4; pointer-events: none; }
.input {
	width: 100%;
	padding: 12px 16px;
	background: rgba(255,255,255,0.07);
	border: 1px solid rgba(255,255,255,0.12);
	border-radius: var(--radius);
	color: var(--text);
	font-size: 1rem;
	outline: none;
	transition: border-color 0.15s;
}
.input:focus { border-color: var(--accent); }
.input::placeholder { color: var(--text-muted); opacity: 0.6; }

/* Join screen */
.join-screen { display: flex; flex-direction: column; gap: 20px; flex: 1; }
.join-screen header { text-align: center; padding: 32px 0 24px; }
.join-screen h1 { font-size: 1.6rem; font-weight: 800; }
.code-input-wrap {
	display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px;
}
.code-input-wrap .label {
	font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;
	letter-spacing: 0.05em; font-weight: 600;
}
.code-input {
	text-align: center; font-size: 2rem; font-weight: 800;
	letter-spacing: 0.15em; text-transform: uppercase; max-width: 200px;
}
.error { color: var(--accent); font-size: 0.9rem; text-align: center; }

/* Race view shared */
.race-screen { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.spectator-badge {
	font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;
	letter-spacing: 0.08em; font-weight: 600; text-align: center; padding: 4px 0;
}
.race-header { display: flex; flex-direction: column; gap: 4px; }
.race-name { font-size: 1.1rem; font-weight: 800; }
.race-meta { display: flex; align-items: center; gap: 10px; }
.race-code {
	font-size: 1.4rem; font-weight: 800; letter-spacing: 0.12em; color: var(--accent);
}
.race-dist { font-size: 0.8rem; color: var(--text-muted); margin-left: auto; }

/* Lobby */
.players-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 2px; }
.player-chip {
	display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px;
	background: var(--bg-card); border: 1px solid rgba(255,255,255,0.06);
	border-radius: 20px; font-size: 0.8rem; font-weight: 600;
}
.player-chip.ready { border-color: #4ade80; }
.ready-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; }

/* Countdown */
.countdown-overlay {
	position: fixed; inset: 0; background: rgba(0,0,0,0.85);
	display: flex; align-items: center; justify-content: center; z-index: 50;
}
.countdown-number {
	font-size: 8rem; font-weight: 900; color: var(--text);
	animation: pulse 0.5s ease-out;
}
.countdown-number.go { color: var(--accent); font-size: 6rem; }
@keyframes pulse {
	0% { transform: scale(1.5); opacity: 0.5; }
	100% { transform: scale(1); opacity: 1; }
}

/* Player cards */
.player-list { display: flex; flex-direction: column; gap: 8px; }
.player-card {
	display: flex; flex-direction: column; gap: 8px; padding: 12px 16px;
}
.player-card.finished { opacity: 0.8; }
.player-card-header { display: flex; justify-content: space-between; align-items: center; }
.player-name { font-weight: 700; font-size: 0.95rem; }
.player-dist { font-size: 0.9rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.progress-track {
	height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;
}
.progress-bar {
	height: 100%; background: var(--accent); border-radius: 3px;
	transition: width 0.3s ease-out;
}
.player-card.finished .progress-bar { background: #4ade80; }

/* Finish */
.finish-screen { display: flex; flex-direction: column; gap: 20px; align-items: center; padding-top: 24px; flex: 1; }
.finish-screen h1 { font-size: 1.8rem; text-align: center; }
.results, .still-racing { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.result-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
.result-row.muted { opacity: 0.5; }
.medal { font-size: 1.5rem; min-width: 32px; }
.result-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.result-name { font-weight: 700; }
.result-dist { font-size: 0.85rem; color: var(--text-muted); }
.result-order { font-weight: 700; color: var(--text-muted); }
.still-label {
	font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;
	letter-spacing: 0.05em; font-weight: 600;
}

/* Chat (read-only) */
.chat-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.messages {
	flex: 1; overflow-y: auto; padding: 8px 0;
	display: flex; flex-direction: column; gap: 4px; min-height: 60px;
}
.msg { font-size: 0.85rem; padding: 2px 0; word-break: break-word; }
.msg-name { font-weight: 600; color: var(--text-muted); margin-right: 4px; }
.msg-text { color: var(--text); }
.msg-emote { font-size: 1.5rem; vertical-align: middle; }
.empty-chat { color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 16px 0; margin: auto 0; }

/* Ghost race */
.ghost-badge {
	display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
	letter-spacing: 0.08em; padding: 3px 8px; border-radius: 6px;
	background: rgba(139, 92, 246, 0.2); color: #a78bfa; margin-bottom: 8px;
}
.ghost-time { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }
.section-label {
	font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;
	letter-spacing: 0.05em; font-weight: 600; margin-bottom: 8px; margin-top: 12px;
}
.ghost-progress-bar { background: #a78bfa; }

.hidden { display: none !important; }
</style>
</head>
<body>
<div class="page" id="app">
	<!-- Join screen -->
	<div class="join-screen" id="join-screen">
		<header>
			<h1>Watch Race</h1>
		</header>
		<div class="code-input-wrap card">
			<span class="label">Race Code</span>
			<input class="input code-input" id="code-input" type="text" placeholder="CODE" maxlength="4" autofocus>
		</div>
		<button class="btn btn-primary" id="watch-btn" disabled>Watch Race</button>
		<p class="error hidden" id="join-error"></p>
	</div>

	<!-- Race screen (all phases) -->
	<div class="race-screen hidden" id="race-screen">
		<div class="spectator-badge">Spectating</div>

		<div class="race-header card" id="race-info">
			<span class="race-name" id="race-name"></span>
			<div class="race-meta">
				<span class="race-code" id="race-code-display"></span>
				<span class="race-dist" id="race-dist"></span>
			</div>
		</div>

		<!-- Lobby phase -->
		<div id="phase-lobby">
			<div class="players-chips" id="lobby-players"></div>
		</div>

		<!-- Racing phase -->
		<div class="hidden" id="phase-racing">
			<div class="player-list" id="race-players"></div>
		</div>

		<!-- Ghost phase -->
		<div class="hidden" id="phase-ghost">
			<div class="ghost-badge">Ghost Race</div>
			<div class="ghost-time" id="ghost-time"></div>
			<div id="ghost-active-section">
				<div class="section-label">Currently Running</div>
				<div class="player-list" id="ghost-active-players"></div>
			</div>
			<div id="ghost-completed-section">
				<div class="section-label">Leaderboard</div>
				<div class="results" id="ghost-completed-results"></div>
			</div>
		</div>

		<!-- Finish phase -->
		<div class="finish-screen hidden" id="phase-finished">
			<h1>Race Complete!</h1>
			<div class="results" id="finished-results"></div>
			<div class="still-racing hidden" id="still-racing">
				<span class="still-label">Still racing...</span>
				<div id="still-racing-list"></div>
			</div>
		</div>

		<!-- Chat (read-only) -->
		<div class="chat-panel card" id="chat-panel">
			<div class="messages" id="messages">
				<div class="empty-chat">No messages yet</div>
			</div>
		</div>
	</div>

	<!-- Countdown overlay -->
	<div class="countdown-overlay hidden" id="countdown-overlay">
		<div class="countdown-number" id="countdown-number">10</div>
	</div>
</div>

<script>
(function() {
	// State
	let ws = null;
	let myId = '';
	let phase = 'join'; // join | lobby | countdown | racing | finished
	let raceName = '';
	let raceCode = '';
	let targetDistance = 0;
	let players = []; // {id, name, ready}
	let distances = {}; // id -> distance
	let finishedPlayers = new Set();
	let finishOrder = {}; // id -> order (1-based)
	let finishCounter = 0;
	let startTime = null;
	let countdownTimer = null;
	let messages = [];
	let isGhostRace = false;
	let ghostRuns = []; // completed runs
	let ghostActiveRunners = {}; // runnerId -> {name, distance}
	let ghostExpiresAt = null;

	// DOM refs
	const joinScreen = document.getElementById('join-screen');
	const raceScreen = document.getElementById('race-screen');
	const codeInput = document.getElementById('code-input');
	const watchBtn = document.getElementById('watch-btn');
	const joinError = document.getElementById('join-error');
	const raceNameEl = document.getElementById('race-name');
	const raceCodeEl = document.getElementById('race-code-display');
	const raceDistEl = document.getElementById('race-dist');
	const phaseLobby = document.getElementById('phase-lobby');
	const phaseRacing = document.getElementById('phase-racing');
	const phaseFinished = document.getElementById('phase-finished');
	const lobbyPlayers = document.getElementById('lobby-players');
	const racePlayers = document.getElementById('race-players');
	const finishedResults = document.getElementById('finished-results');
	const stillRacing = document.getElementById('still-racing');
	const stillRacingList = document.getElementById('still-racing-list');
	const countdownOverlay = document.getElementById('countdown-overlay');
	const countdownNumber = document.getElementById('countdown-number');
	const messagesEl = document.getElementById('messages');
	const chatPanel = document.getElementById('chat-panel');
	const phaseGhost = document.getElementById('phase-ghost');
	const ghostTime = document.getElementById('ghost-time');
	const ghostActivePlayers = document.getElementById('ghost-active-players');
	const ghostActiveSection = document.getElementById('ghost-active-section');
	const ghostCompletedResults = document.getElementById('ghost-completed-results');
	const ghostCompletedSection = document.getElementById('ghost-completed-section');

	// Helpers
	function formatDistance(m) {
		if (m >= 1000) return (m / 1000).toFixed(2) + ' km';
		return Math.round(m) + ' m';
	}

	function medal(order) {
		if (order === 1) return '\\u{1F947}';
		if (order === 2) return '\\u{1F948}';
		if (order === 3) return '\\u{1F949}';
		return '';
	}

	function show(el) { el.classList.remove('hidden'); }
	function hide(el) { el.classList.add('hidden'); }

	// Input handling
	codeInput.addEventListener('input', () => {
		codeInput.value = codeInput.value.toUpperCase();
		watchBtn.disabled = codeInput.value.length < 4;
	});

	codeInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && codeInput.value.length >= 4) {
			connectAndWatch();
		}
	});

	watchBtn.addEventListener('click', connectAndWatch);

	function connectAndWatch() {
		const code = codeInput.value.trim().toUpperCase();
		if (code.length < 4) return;

		watchBtn.disabled = true;
		watchBtn.textContent = 'Connecting...';
		hide(joinError);

		const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
		ws = new WebSocket(proto + '//' + location.host + '/ws');

		ws.onopen = () => {};

		ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data);
				handleMessage(msg);
			} catch {}
		};

		ws.onclose = () => {
			// If we're still on join screen, show error
			if (phase === 'join') {
				showError('Connection lost. Try again.');
				watchBtn.disabled = false;
				watchBtn.textContent = 'Watch Race';
			}
		};

		ws.onerror = () => {};

		// Store code so we can use it once connected
		raceCode = code;
	}

	function showError(msg) {
		joinError.textContent = msg;
		show(joinError);
	}

	function handleMessage(msg) {
		switch (msg.type) {
			case 'connected':
				myId = msg.id;
				ws.send(JSON.stringify({ type: 'watch-race', code: raceCode }));
				break;

			case 'race-watched':
				raceName = msg.raceName;
				raceCode = msg.code;
				targetDistance = msg.targetDistance;
				players = msg.players || [];
				distances = {};
				finishedPlayers = new Set();
				finishOrder = {};
				finishCounter = 0;
				messages = msg.messages || [];

				if (msg.distances) {
					for (const d of msg.distances) {
						distances[d.id] = d.distance;
						if (d.finished) {
							finishedPlayers.add(d.id);
							finishCounter++;
							finishOrder[d.id] = finishCounter;
						}
					}
				}

				// Set up header
				raceNameEl.textContent = raceName;
				raceCodeEl.textContent = raceCode;
				raceDistEl.textContent = formatDistance(targetDistance);

				// Switch to race screen
				hide(joinScreen);
				show(raceScreen);

				// Enter appropriate phase
				if (msg.phase === 'countdown' && msg.startTime) {
					startTime = msg.startTime;
					setPhase('countdown');
				} else if (msg.phase === 'racing') {
					setPhase('racing');
				} else if (msg.phase === 'finished') {
					setPhase('finished');
				} else {
					setPhase('lobby');
				}

				renderMessages();
				break;

			case 'error':
				showError(msg.message);
				watchBtn.disabled = false;
				watchBtn.textContent = 'Watch Race';
				break;

			case 'player-joined':
				players = msg.players || [];
				if (phase === 'lobby') renderLobby();
				break;

			case 'player-left':
				players = msg.players || [];
				if (phase === 'lobby') renderLobby();
				else if (phase === 'racing') renderRacing();
				else if (phase === 'finished') renderFinished();
				break;

			case 'player-ready':
				for (const p of players) {
					if (p.id === msg.playerId) p.ready = msg.ready;
				}
				if (msg.players) players = msg.players;
				if (phase === 'lobby') renderLobby();
				break;

			case 'countdown-start':
				startTime = msg.startTime;
				setPhase('countdown');
				break;

			case 'countdown-cancelled':
				setPhase('lobby');
				break;

			case 'race-started':
				setPhase('racing');
				break;

			case 'race-distances':
				for (const p of msg.players) {
					distances[p.id] = p.distance;
					if (p.finished && !finishedPlayers.has(p.id)) {
						finishedPlayers.add(p.id);
						finishCounter++;
						finishOrder[p.id] = finishCounter;
					}
				}
				if (phase === 'racing') renderRacing();
				break;

			case 'player-finished':
				if (!finishedPlayers.has(msg.playerId)) {
					finishedPlayers.add(msg.playerId);
					finishCounter++;
					finishOrder[msg.playerId] = finishCounter;
				}
				if (phase === 'racing') renderRacing();
				break;

			case 'chat-message':
			case 'emote':
				messages.push({
					id: msg.id,
					senderId: msg.senderId,
					senderName: msg.senderName,
					type: msg.messageType || (msg.type === 'emote' ? 'emote' : 'chat'),
					text: msg.text,
					timestamp: msg.timestamp
				});
				renderMessages();
				break;

			// Ghost race messages
			case 'ghost-race-watched':
				isGhostRace = true;
				raceName = msg.raceName;
				raceCode = msg.code;
				targetDistance = msg.targetDistance;
				ghostExpiresAt = msg.expiresAt;
				ghostRuns = msg.runs || [];
				ghostActiveRunners = {};
				for (const r of (msg.activeRunners || [])) {
					ghostActiveRunners[r.runnerId] = { name: r.runnerName, distance: r.distance || 0 };
				}
				messages = msg.messages || [];

				raceNameEl.textContent = raceName;
				raceCodeEl.textContent = raceCode;
				raceDistEl.textContent = formatDistance(targetDistance);

				hide(joinScreen);
				show(raceScreen);
				setPhase('ghost');
				renderMessages();
				break;

			case 'ghost-run-sample':
				if (!ghostActiveRunners[msg.runnerId]) {
					ghostActiveRunners[msg.runnerId] = { name: msg.runnerName || msg.runnerId, distance: 0 };
				}
				ghostActiveRunners[msg.runnerId].distance = msg.distance;
				if (phase === 'ghost') renderGhost();
				break;

			case 'ghost-runner-starting':
				if (!ghostActiveRunners[msg.runnerId]) {
					ghostActiveRunners[msg.runnerId] = { name: msg.runnerName, distance: 0 };
				}
				if (phase === 'ghost') renderGhost();
				break;

			case 'ghost-run-complete':
				if (msg.run) {
					ghostRuns.push(msg.run);
					delete ghostActiveRunners[msg.run.runnerId];
				}
				if (phase === 'ghost') renderGhost();
				break;
		}
	}

	function setPhase(newPhase) {
		phase = newPhase;

		hide(phaseLobby);
		hide(phaseRacing);
		hide(phaseFinished);
		hide(countdownOverlay);
		hide(phaseGhost);

		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}

		switch (phase) {
			case 'lobby':
				show(phaseLobby);
				show(chatPanel);
				renderLobby();
				break;
			case 'countdown':
				show(phaseLobby);
				show(chatPanel);
				show(countdownOverlay);
				startCountdown();
				break;
			case 'racing':
				show(phaseRacing);
				show(chatPanel);
				renderRacing();
				break;
			case 'finished':
				show(phaseFinished);
				hide(chatPanel);
				renderFinished();
				break;
			case 'ghost':
				show(phaseGhost);
				show(chatPanel);
				renderGhost();
				break;
		}
	}

	function startCountdown() {
		function update() {
			if (!startTime) return;
			const remaining = Math.ceil((startTime - Date.now()) / 1000);
			const val = Math.max(0, remaining);
			if (val > 0) {
				countdownNumber.textContent = val;
				countdownNumber.classList.remove('go');
			} else {
				countdownNumber.textContent = 'GO!';
				countdownNumber.classList.add('go');
			}
		}
		update();
		countdownTimer = setInterval(update, 100);
	}

	function renderLobby() {
		lobbyPlayers.innerHTML = '';
		for (const p of players) {
			const chip = document.createElement('div');
			chip.className = 'player-chip' + (p.ready ? ' ready' : '');
			chip.textContent = p.name;
			if (p.ready) {
				const dot = document.createElement('span');
				dot.className = 'ready-dot';
				chip.appendChild(dot);
			}
			lobbyPlayers.appendChild(chip);
		}
	}

	function renderRacing() {
		// Sort by distance descending
		const sorted = [...players].sort((a, b) => {
			return (distances[b.id] || 0) - (distances[a.id] || 0);
		});

		racePlayers.innerHTML = '';
		for (const p of sorted) {
			const dist = distances[p.id] || 0;
			const finished = finishedPlayers.has(p.id);
			const progress = Math.min(100, (dist / targetDistance) * 100);
			const order = finishOrder[p.id] || null;

			const card = document.createElement('div');
			card.className = 'player-card card' + (finished ? ' finished' : '');
			card.innerHTML =
				'<div class="player-card-header">' +
					'<span class="player-name">' +
						(finished ? medal(order) + ' ' : '') +
						escapeHtml(p.name) +
					'</span>' +
					'<span class="player-dist">' + formatDistance(dist) + '</span>' +
				'</div>' +
				'<div class="progress-track">' +
					'<div class="progress-bar" style="width:' + progress + '%"></div>' +
				'</div>';
			racePlayers.appendChild(card);
		}
	}

	function renderFinished() {
		const finished = players
			.filter(p => finishedPlayers.has(p.id))
			.sort((a, b) => (finishOrder[a.id] || 999) - (finishOrder[b.id] || 999));

		const unfinished = players.filter(p => !finishedPlayers.has(p.id));

		finishedResults.innerHTML = '';
		for (const p of finished) {
			const dist = distances[p.id] || 0;
			const order = finishOrder[p.id] || null;
			const row = document.createElement('div');
			row.className = 'result-row card';
			row.innerHTML =
				'<span class="medal">' + medal(order) + '</span>' +
				'<div class="result-info">' +
					'<span class="result-name">' + escapeHtml(p.name) + '</span>' +
					'<span class="result-dist">' + formatDistance(dist) + '</span>' +
				'</div>' +
				'<span class="result-order">#' + order + '</span>';
			finishedResults.appendChild(row);
		}

		if (unfinished.length > 0) {
			show(stillRacing);
			stillRacingList.innerHTML = '';
			for (const p of unfinished) {
				const dist = distances[p.id] || 0;
				const row = document.createElement('div');
				row.className = 'result-row card muted';
				row.innerHTML =
					'<div class="result-info">' +
						'<span class="result-name">' + escapeHtml(p.name) + '</span>' +
						'<span class="result-dist">' + formatDistance(dist) + '</span>' +
					'</div>';
				stillRacingList.appendChild(row);
			}
		} else {
			hide(stillRacing);
		}
	}

	function formatDuration(startedAt, finishedAt) {
		const ms = finishedAt - startedAt;
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return minutes + ':' + String(seconds).padStart(2, '0');
	}

	function renderGhost() {
		// Time remaining
		if (ghostExpiresAt) {
			const diff = ghostExpiresAt - Date.now();
			if (diff <= 0) {
				ghostTime.textContent = 'Race closed';
			} else {
				const days = Math.floor(diff / (24 * 60 * 60 * 1000));
				const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
				if (days > 0) ghostTime.textContent = days + 'd ' + hours + 'h remaining';
				else ghostTime.textContent = hours + 'h remaining';
			}
		}

		// Active runners
		const activeIds = Object.keys(ghostActiveRunners);
		if (activeIds.length > 0) {
			show(ghostActiveSection);
			ghostActivePlayers.innerHTML = '';
			const sorted = activeIds
				.map(id => ({ id, ...ghostActiveRunners[id] }))
				.sort((a, b) => b.distance - a.distance);
			for (const r of sorted) {
				const progress = Math.min(100, (r.distance / targetDistance) * 100);
				const card = document.createElement('div');
				card.className = 'player-card card';
				card.innerHTML =
					'<div class="player-card-header">' +
						'<span class="player-name">' + escapeHtml(r.name) + '</span>' +
						'<span class="player-dist">' + formatDistance(r.distance) + '</span>' +
					'</div>' +
					'<div class="progress-track">' +
						'<div class="progress-bar ghost-progress-bar" style="width:' + progress + '%"></div>' +
					'</div>';
				ghostActivePlayers.appendChild(card);
			}
		} else {
			hide(ghostActiveSection);
		}

		// Completed runs
		const completed = ghostRuns
			.filter(r => r.finishedAt != null)
			.sort((a, b) => {
				const aDur = a.finishedAt - a.startedAt;
				const bDur = b.finishedAt - b.startedAt;
				return aDur - bDur;
			});

		if (completed.length > 0) {
			show(ghostCompletedSection);
			ghostCompletedResults.innerHTML = '';
			for (let i = 0; i < completed.length; i++) {
				const r = completed[i];
				const row = document.createElement('div');
				row.className = 'result-row card';
				row.innerHTML =
					'<span class="medal">' + medal(i + 1) + '</span>' +
					'<div class="result-info">' +
						'<span class="result-name">' + escapeHtml(r.runnerName) + '</span>' +
						'<span class="result-dist">' + formatDistance(r.finalDistance) +
							' \\u00B7 ' + formatDuration(r.startedAt, r.finishedAt) + '</span>' +
					'</div>' +
					'<span class="result-order">#' + (i + 1) + '</span>';
				ghostCompletedResults.appendChild(row);
			}
		} else {
			hide(ghostCompletedSection);
		}
	}

	function renderMessages() {
		if (messages.length === 0) {
			messagesEl.innerHTML = '<div class="empty-chat">No messages yet</div>';
			return;
		}
		messagesEl.innerHTML = '';
		for (const msg of messages) {
			const div = document.createElement('div');
			div.className = 'msg';
			if (msg.type === 'emote') {
				div.innerHTML =
					'<span class="msg-name">' + escapeHtml(msg.senderName) + ':</span>' +
					'<span class="msg-emote">' + msg.text + '</span>';
			} else {
				div.innerHTML =
					'<span class="msg-name">' + escapeHtml(msg.senderName) + ':</span>' +
					'<span class="msg-text">' + escapeHtml(msg.text) + '</span>';
			}
			messagesEl.appendChild(div);
		}
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function escapeHtml(str) {
		const div = document.createElement('div');
		div.textContent = str;
		return div.innerHTML;
	}
})();
</script>
</body>
</html>`;
}
