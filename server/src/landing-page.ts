export function getLandingHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Race Your Friends — Real-time GPS Racing</title>
<meta name="description" content="Real-time GPS racing. Anywhere. Against anyone. Create a race, share the code, and compete by physically moving.">
<style>
:root {
	--gray: #E9DFDD;
	--silver: #C7C8C5;
	--crimson: #FF1627;
	--crimson-glow: rgba(255, 22, 39, 0.35);
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
body { min-height: 100dvh; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
a { color: inherit; text-decoration: none; }

/* ── Buttons ── */
.btn {
	display: inline-flex; align-items: center; justify-content: center; gap: 8px;
	padding: 16px 32px; border-radius: var(--radius); font-weight: 700; font-size: 1rem;
	transition: all 0.2s; border: none; cursor: pointer; font: inherit;
}
.btn:active { transform: scale(0.97); }
.btn-primary {
	background: var(--accent); color: white;
	box-shadow: 0 0 20px var(--crimson-glow), 0 4px 12px rgba(0,0,0,0.3);
}
.btn-primary:hover { opacity: 0.9; box-shadow: 0 0 30px var(--crimson-glow), 0 4px 16px rgba(0,0,0,0.4); transform: translateY(-1px); }
.btn-secondary {
	background: rgba(255,255,255,0.06); color: var(--text);
	border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(8px);
}
.btn-secondary:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); transform: translateY(-1px); }

/* ── Noise texture overlay ── */
body::before {
	content: ''; position: fixed; inset: 0; z-index: 9999; pointer-events: none;
	background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
	background-repeat: repeat; background-size: 256px 256px; opacity: 0.4;
}

/* ── Hero ── */
.hero {
	min-height: 100dvh; display: flex; flex-direction: column;
	align-items: center; justify-content: center; text-align: center;
	padding: 40px 24px; position: relative; overflow: hidden;
}
.hero::before {
	content: ''; position: absolute; top: -40%; left: 50%; transform: translateX(-50%);
	width: 800px; height: 800px;
	background: radial-gradient(circle, var(--crimson-glow) 0%, transparent 70%);
	opacity: 0.3; pointer-events: none;
}
.hero::after {
	content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 200px;
	background: linear-gradient(to top, var(--bg), transparent);
	pointer-events: none;
}
.hero-badge {
	font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
	letter-spacing: 0.12em; color: var(--accent); margin-bottom: 20px;
	padding: 6px 16px; border: 1px solid rgba(255,22,39,0.25); border-radius: 20px;
	background: rgba(255,22,39,0.06);
	position: relative; z-index: 1;
}
.hero h1 {
	font-size: 3.5rem; font-weight: 900; line-height: 1.05; margin-bottom: 20px;
	position: relative; z-index: 1;
	letter-spacing: -0.02em;
}
.hero h1 span { color: var(--accent); }
.hero .tagline {
	font-size: 1.2rem; color: var(--text-muted); max-width: 440px; margin-bottom: 44px;
	position: relative; z-index: 1; line-height: 1.5;
}
.hero-buttons { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; position: relative; z-index: 1; }
.scroll-hint {
	position: absolute; bottom: 32px; z-index: 1;
	font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.1em;
	text-transform: uppercase; font-weight: 600;
	animation: bounce 2s infinite;
	opacity: 0.7;
}
.scroll-hint svg { display: block; margin: 6px auto 0; width: 20px; height: 20px; stroke: var(--text-muted); }
@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(6px); }
}


/* ── Feature walkthrough ── */
.walkthrough { position: relative; max-width: 1200px; margin: 0 auto; padding: 0 24px; margin-top: 80px; }
.walkthrough-grid { display: grid; grid-template-columns: 1fr 480px; gap: 40px; }
.text-track { display: flex; flex-direction: column; position: relative; }
.phone-track { position: relative; }
.phone-sticky { position: sticky; top: 50%; transform: translateY(-50%); padding: 40px 0; }


/* Feature section */
.feature-section {
	min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
	padding: 80px 24px 80px 0; opacity: 0; transform: translateY(40px);
	transition: opacity 0.7s ease-out, transform 0.7s ease-out;
	position: relative;
}
.feature-section.visible { opacity: 1; transform: translateY(0); }

/* Alternating tinted backgrounds that bleed full-width */
.feature-section.alt::after {
	content: ''; position: absolute;
	top: 0; bottom: 0;
	/* Stretch to viewport edges regardless of parent max-width */
	left: calc(-50vw + 50%); right: calc(-50vw + 50%);
	background: rgba(255,255,255,0.018);
	border-top: 1px solid rgba(255,255,255,0.03);
	border-bottom: 1px solid rgba(255,255,255,0.03);
	z-index: -1; pointer-events: none;
}

/* Decorative radial glows per section */
.feature-section::before {
	content: ''; position: absolute; top: 20%; right: -200px; width: 500px; height: 60%;
	background: radial-gradient(ellipse at center, rgba(255,22,39,0.025) 0%, transparent 70%);
	pointer-events: none; z-index: -1;
}
.feature-section.alt::before {
	left: -200px; right: auto;
	background: radial-gradient(ellipse at center, rgba(255,22,39,0.02) 0%, transparent 70%);
}

.feature-icon {
	width: 48px; height: 48px; border-radius: 14px; display: flex;
	align-items: center; justify-content: center; font-size: 1.4rem;
	margin-bottom: 16px; position: relative; z-index: 1;
	background: rgba(255,22,39,0.08); border: 1px solid rgba(255,22,39,0.15);
	box-shadow: 0 0 20px rgba(255,22,39,0.1);
}
.feature-icon.green {
	background: rgba(74,222,128,0.08); border-color: rgba(74,222,128,0.15);
	box-shadow: 0 0 20px rgba(74,222,128,0.08);
}
.feature-icon.purple {
	background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.15);
	box-shadow: 0 0 20px rgba(139,92,246,0.08);
}
.feature-label {
	font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
	letter-spacing: 0.12em; color: var(--accent); margin-bottom: 8px;
}
.feature-section h2 {
	font-size: 2.2rem; font-weight: 800; margin-bottom: 14px; line-height: 1.15;
	letter-spacing: -0.01em;
}
.feature-section p {
	color: var(--text-muted); font-size: 1.05rem; line-height: 1.65; max-width: 400px;
}
.feature-highlights {
	display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px;
}
.feature-pill {
	font-size: 0.72rem; font-weight: 600; padding: 5px 12px; border-radius: 16px;
	background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
	color: var(--text-muted);
}

/* ── Phone mockup ── */
.phone-frame {
	width: 420px; height: 840px; border-radius: 54px; overflow: hidden;
	border: 3px solid rgba(255,255,255,0.12); background: var(--bg);
	position: relative; margin: 0 auto;
	box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(255,22,39,0.08), inset 0 1px 0 rgba(255,255,255,0.08);
}
.phone-glow {
	position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
	width: 550px; height: 550px;
	background: radial-gradient(circle, rgba(255,22,39,0.1) 0%, transparent 70%);
	pointer-events: none; z-index: -1;
}
.phone-notch {
	position: absolute; top: 0; left: 50%; transform: translateX(-50%);
	width: 150px; height: 34px; background: var(--black);
	border-radius: 0 0 20px 20px; z-index: 10;
}
.phone-screen {
	width: 100%; height: 100%; overflow: hidden; padding: 44px 20px 20px;
	display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;
}

/* ── Phone demo content ── */
.demo-header {
	display: flex; flex-direction: column; gap: 2px; padding: 8px 12px;
	background: var(--bg-card); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
}
.demo-race-name { font-weight: 800; font-size: 1rem; }
.demo-race-meta { display: flex; align-items: center; gap: 8px; }
.demo-race-code { font-weight: 800; letter-spacing: 0.1em; color: var(--accent); font-size: 1.15rem; }
.demo-race-dist { color: var(--text-muted); font-size: 0.82rem; margin-left: auto; }

.demo-players-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.demo-chip {
	display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px;
	background: var(--bg-card); border: 1px solid rgba(255,255,255,0.06);
	border-radius: 16px; font-size: 0.82rem; font-weight: 600;
	transition: border-color 0.3s;
}
.demo-chip.ready { border-color: #4ade80; }
.demo-ready-dot { width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }

.demo-player-card {
	display: flex; flex-direction: column; gap: 5px; padding: 8px 12px;
	background: var(--bg-card); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
}
.demo-player-card.finished { opacity: 0.7; }
.demo-player-header { display: flex; justify-content: space-between; align-items: center; }
.demo-player-name { font-weight: 700; font-size: 0.92rem; }
.demo-player-dist { font-size: 0.85rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.demo-progress-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.demo-progress-bar { height: 100%; border-radius: 2px; transition: width 0.4s ease-out; background: var(--accent); }
.demo-player-card.finished .demo-progress-bar { background: #4ade80; }

.demo-countdown {
	position: absolute; inset: 0; background: rgba(0,0,0,0.88);
	display: flex; align-items: center; justify-content: center;
	z-index: 20; border-radius: 51px; opacity: 0; pointer-events: none;
	transition: opacity 0.3s;
}
.demo-countdown.active { opacity: 1; }
.demo-countdown-num {
	font-size: 7rem; font-weight: 900; color: var(--text);
	animation: demo-pulse 0.5s ease-out;
	text-shadow: 0 0 40px rgba(255,255,255,0.2);
}
.demo-countdown-num.go { color: var(--accent); font-size: 5rem; text-shadow: 0 0 40px var(--crimson-glow); }
@keyframes demo-pulse {
	0% { transform: scale(1.4); opacity: 0.4; }
	100% { transform: scale(1); opacity: 1; }
}

.demo-chat {
	margin-top: auto; display: flex; flex-direction: column; gap: 2px;
	padding: 8px; background: var(--bg-card); border-radius: 10px;
	border: 1px solid rgba(255,255,255,0.06); max-height: 90px; overflow: hidden;
}
.demo-msg { font-size: 0.82rem; word-break: break-word; }
.demo-msg-name { font-weight: 600; color: var(--text-muted); margin-right: 3px; }
.demo-msg-emote { font-size: 1rem; vertical-align: middle; }

.demo-finish-title { font-size: 1.2rem; font-weight: 800; text-align: center; padding: 8px 0; }
.demo-result-row {
	display: flex; align-items: center; gap: 8px; padding: 8px 12px;
	background: var(--bg-card); border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
}
.demo-medal { font-size: 1.1rem; min-width: 24px; }
.demo-result-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.demo-result-name { font-weight: 700; font-size: 0.9rem; }
.demo-result-dist { font-size: 0.78rem; color: var(--text-muted); }
.demo-result-order { font-weight: 700; color: var(--text-muted); font-size: 0.9rem; }

.demo-ghost-badge {
	display: inline-block; font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
	letter-spacing: 0.08em; padding: 2px 6px; border-radius: 4px;
	background: rgba(139,92,246,0.2); color: #a78bfa;
}
.demo-ghost-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
.demo-section-label {
	font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase;
	letter-spacing: 0.05em; font-weight: 600; margin-top: 8px; margin-bottom: 4px;
}
.demo-ghost-bar { background: #a78bfa !important; }


/* ── CTA footer ── */
.cta-footer {
	text-align: center; padding: 120px 24px; position: relative; overflow: hidden;
}
.cta-footer::before {
	content: ''; position: absolute; bottom: -200px; left: 50%; transform: translateX(-50%);
	width: 600px; height: 600px;
	background: radial-gradient(circle, var(--crimson-glow) 0%, transparent 70%);
	opacity: 0.2; pointer-events: none;
}
.cta-footer h2 {
	font-size: 2.8rem; font-weight: 900; margin-bottom: 14px;
	position: relative; z-index: 1; letter-spacing: -0.02em;
}
.cta-footer p { color: var(--text-muted); margin-bottom: 36px; font-size: 1.1rem; position: relative; z-index: 1; }
.cta-footer .hero-buttons { justify-content: center; position: relative; z-index: 1; }

/* ── Footer ── */
.footer {
	text-align: center; padding: 32px 24px; border-top: 1px solid rgba(255,255,255,0.06);
	font-size: 0.75rem; color: rgba(255,255,255,0.25);
}

/* ── Responsive ── */
@media (max-width: 768px) {
	.hero h1 { font-size: 2.4rem; }
	.hero::before { width: 500px; height: 500px; }
	.walkthrough-grid { grid-template-columns: 1fr; }
	.phone-track { display: none; }
	.feature-section { min-height: auto; padding: 60px 0; }
	.feature-section h2 { font-size: 1.6rem; }
	.mobile-phone { display: block; margin: 24px auto 0; }
	.cta-footer h2 { font-size: 2rem; }
	.cta-footer { padding: 80px 24px; }
}
@media (min-width: 769px) {
	.mobile-phone { display: none; }
}
</style>
</head>
<body>

<!-- ── Hero ── -->
<section class="hero">
	<div class="hero-badge">Free &bull; No Account Required</div>
	<h1>Race Your <span>Friends</span></h1>
	<p class="tagline">Real-time GPS racing. Anywhere. Against anyone. Just share a code and start moving.</p>
	<div class="hero-buttons">
		<a class="btn btn-primary" href="https://apps.apple.com" target="_blank">Get the App</a>
		<a class="btn btn-secondary" href="/watch">Spectate a Race</a>
	</div>
	<div class="scroll-hint">Scroll to explore<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
</section>


<!-- ── Feature walkthrough ── -->
<section class="walkthrough">
	<div class="walkthrough-grid">
		<div class="text-track">

			<div class="feature-section" data-phase="lobby">
				<div class="feature-icon">&#x1F3C1;</div>
				<div class="feature-label">Step 1</div>
				<h2>Create a Race</h2>
				<p>Pick a distance and get a 4-character code to share. No sign-up, no email, no friction.</p>
				<div class="feature-highlights">
					<span class="feature-pill">500m</span>
					<span class="feature-pill">1 km</span>
					<span class="feature-pill">2 km</span>
					<span class="feature-pill">5 km</span>
					<span class="feature-pill">Custom</span>
				</div>
				<div class="mobile-phone"></div>
			</div>

			<div class="feature-section alt" data-phase="lobby-ready">
				<div class="feature-icon green">&#x1F91D;</div>
				<div class="feature-label">Step 2</div>
				<h2>Gather Your Friends</h2>
				<p>Share the code. Watch players join the lobby, trash-talk in chat, and ready up. When everyone is set — the countdown begins.</p>
				<div class="feature-highlights">
					<span class="feature-pill">Live lobby</span>
					<span class="feature-pill">Chat</span>
					<span class="feature-pill">Ready check</span>
				</div>
				<div class="mobile-phone"></div>
			</div>

			<div class="feature-section" data-phase="countdown">
				<div class="feature-icon">&#x23F0;</div>
				<div class="feature-label">Step 3</div>
				<h2>3... 2... 1... GO!</h2>
				<p>A synced countdown on every screen. When it hits zero, start moving — run, walk, bike, whatever you want.</p>
				<div class="mobile-phone"></div>
			</div>

			<div class="feature-section alt" data-phase="racing">
				<div class="feature-icon">&#x1F4F1;</div>
				<div class="feature-label">Step 4</div>
				<h2>Race in Real Time</h2>
				<p>Watch the live leaderboard as GPS tracks everyone's distance. Send emotes, trash-talk in chat, and fight for every meter.</p>
				<div class="feature-highlights">
					<span class="feature-pill">Live leaderboard</span>
					<span class="feature-pill">GPS tracking</span>
					<span class="feature-pill">Emotes</span>
					<span class="feature-pill">Position swaps</span>
				</div>
				<div class="mobile-phone"></div>
			</div>

			<div class="feature-section" data-phase="finished">
				<div class="feature-icon green">&#x1F3C6;</div>
				<div class="feature-label">Step 5</div>
				<h2>Cross the Finish Line</h2>
				<p>First to hit the target distance wins. See final results with medals and finish order. Bragging rights earned.</p>
				<div class="mobile-phone"></div>
			</div>

			<div class="feature-section alt" data-phase="ghost">
				<div class="feature-icon purple">&#x1F47B;</div>
				<div class="feature-label">Bonus</div>
				<h2>Ghost Races</h2>
				<p>Can't race at the same time? Create a ghost race that stays open for up to 7 days. Everyone runs on their own schedule — fastest time wins.</p>
				<div class="feature-highlights">
					<span class="feature-pill">Async competition</span>
					<span class="feature-pill">1-7 day window</span>
					<span class="feature-pill">Best time wins</span>
				</div>
				<div class="mobile-phone"></div>
			</div>

		</div>

		<div class="phone-track">
			<div class="phone-sticky">
				<div class="phone-glow"></div>
				<div class="phone-frame">
					<div class="phone-notch"></div>
					<div class="demo-countdown" id="demo-countdown">
						<div class="demo-countdown-num" id="demo-countdown-num">3</div>
					</div>
					<div class="phone-screen" id="phone-screen"></div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── CTA footer ── -->
<section class="cta-footer">
	<h2>Ready to Race?</h2>
	<p>Download the app and challenge your friends in minutes.</p>
	<div class="hero-buttons">
		<a class="btn btn-primary" href="https://apps.apple.com" target="_blank">Get the App</a>
		<a class="btn btn-secondary" href="/watch">Spectate a Race</a>
	</div>
</section>

<footer class="footer">Race Your Friends</footer>

<script>
(function() {
	var PLAYERS = [
		{ id: 'you', name: 'You' },
		{ id: 'alice', name: 'Alice' },
		{ id: 'bob', name: 'Bob' },
		{ id: 'carol', name: 'Carol' }
	];
	var TARGET = 2000;
	var CHAT_LINES = [
		{ name: 'Alice', text: 'good luck everyone!', emote: false },
		{ name: 'Bob', text: '\\u{1F525}', emote: true },
		{ name: 'Carol', text: 'ready to lose? \\u{1F602}', emote: false },
		{ name: 'Alice', text: '\\u{1F4AA}', emote: true },
		{ name: 'Bob', text: 'lets gooo', emote: false },
		{ name: 'Carol', text: '\\u{1F3C3}', emote: true },
		{ name: 'Alice', text: 'bob is catching up!', emote: false },
		{ name: 'Bob', text: '\\u{1F4A8}', emote: true },
	];
	var speeds = { you: 3.2, alice: 3.5, bob: 2.8, carol: 3.0 };
	var variance = { you: 0.8, alice: 0.6, bob: 1.2, carol: 0.9 };

	var currentPhase = null;
	var distances = {};
	var finished = {};
	var finishOrder = [];
	var chatMessages = [];
	var lobbyJoined = [];
	var lobbyReady = {};
	var simInterval = null;
	var chatInterval = null;
	var chatIdx = 0;
	var countdownTimer = null;

	var screen = document.getElementById('phone-screen');
	var countdownOverlay = document.getElementById('demo-countdown');
	var countdownNum = document.getElementById('demo-countdown-num');

	function fmt(m) {
		if (m >= 1000) return (m / 1000).toFixed(2) + ' km';
		return Math.round(m) + ' m';
	}
	function medal(i) {
		if (i === 0) return '\\u{1F947}';
		if (i === 1) return '\\u{1F948}';
		if (i === 2) return '\\u{1F949}';
		return '';
	}
	function esc(s) {
		var d = document.createElement('div');
		d.textContent = s;
		return d.innerHTML;
	}

	function renderHeader() {
		return '<div class="demo-header">' +
			'<div class="demo-race-name">Demo Race</div>' +
			'<div class="demo-race-meta">' +
				'<span class="demo-race-code">DEMO</span>' +
				'<span class="demo-race-dist">' + fmt(TARGET) + '</span>' +
			'</div></div>';
	}

	function renderChat() {
		if (chatMessages.length === 0) return '';
		var html = '<div class="demo-chat">';
		var show = chatMessages.slice(-4);
		for (var i = 0; i < show.length; i++) {
			var m = show[i];
			html += '<div class="demo-msg"><span class="demo-msg-name">' + esc(m.name) + ':</span>';
			if (m.emote) html += '<span class="demo-msg-emote">' + m.text + '</span>';
			else html += '<span>' + esc(m.text) + '</span>';
			html += '</div>';
		}
		html += '</div>';
		return html;
	}

	function renderLobby() {
		var html = renderHeader();
		html += '<div class="demo-players-chips">';
		for (var i = 0; i < lobbyJoined.length; i++) {
			var p = lobbyJoined[i];
			var ready = lobbyReady[p.id];
			html += '<div class="demo-chip' + (ready ? ' ready' : '') + '">' + esc(p.name);
			if (ready) html += '<span class="demo-ready-dot"></span>';
			html += '</div>';
		}
		html += '</div>';
		html += renderChat();
		screen.innerHTML = html;
	}

	function renderRacing() {
		var sorted = PLAYERS.slice().sort(function(a, b) {
			return (distances[b.id] || 0) - (distances[a.id] || 0);
		});
		var html = renderHeader();
		for (var i = 0; i < sorted.length; i++) {
			var p = sorted[i];
			var d = distances[p.id] || 0;
			var done = finished[p.id];
			var pct = Math.min(100, (d / TARGET) * 100);
			var orderIdx = finishOrder.indexOf(p.id);
			html += '<div class="demo-player-card' + (done ? ' finished' : '') + '">' +
				'<div class="demo-player-header">' +
					'<span class="demo-player-name">' + (orderIdx >= 0 ? medal(orderIdx) + ' ' : '') + esc(p.name) + '</span>' +
					'<span class="demo-player-dist">' + fmt(d) + '</span>' +
				'</div>' +
				'<div class="demo-progress-track">' +
					'<div class="demo-progress-bar" style="width:' + pct + '%"></div>' +
				'</div></div>';
		}
		html += renderChat();
		screen.innerHTML = html;
	}

	function renderFinished() {
		var html = renderHeader();
		html += '<div class="demo-finish-title">Race Complete!</div>';
		for (var i = 0; i < finishOrder.length; i++) {
			var id = finishOrder[i];
			var p = PLAYERS.find(function(x) { return x.id === id; });
			html += '<div class="demo-result-row">' +
				'<span class="demo-medal">' + medal(i) + '</span>' +
				'<div class="demo-result-info">' +
					'<span class="demo-result-name">' + esc(p.name) + '</span>' +
					'<span class="demo-result-dist">' + fmt(TARGET) + '</span>' +
				'</div>' +
				'<span class="demo-result-order">#' + (i + 1) + '</span>' +
			'</div>';
		}
		screen.innerHTML = html;
	}

	function renderGhost() {
		var html = renderHeader();
		html += '<div class="demo-ghost-badge">Ghost Race</div>';
		html += '<div class="demo-ghost-time">2d 14h remaining</div>';
		html += '<div class="demo-section-label">Leaderboard</div>';
		var ghostRuns = [
			{ name: 'Alice', time: '8:42', dist: TARGET },
			{ name: 'You', time: '9:15', dist: TARGET },
			{ name: 'Bob', time: '11:03', dist: TARGET },
		];
		for (var i = 0; i < ghostRuns.length; i++) {
			var r = ghostRuns[i];
			html += '<div class="demo-result-row">' +
				'<span class="demo-medal">' + medal(i) + '</span>' +
				'<div class="demo-result-info">' +
					'<span class="demo-result-name">' + esc(r.name) + '</span>' +
					'<span class="demo-result-dist">' + fmt(r.dist) + ' \\u00B7 ' + r.time + '</span>' +
				'</div>' +
				'<span class="demo-result-order">#' + (i + 1) + '</span>' +
			'</div>';
		}
		html += '<div class="demo-section-label">Currently Running</div>';
		html += '<div class="demo-player-card">' +
			'<div class="demo-player-header">' +
				'<span class="demo-player-name">Carol</span>' +
				'<span class="demo-player-dist">1.24 km</span>' +
			'</div>' +
			'<div class="demo-progress-track">' +
				'<div class="demo-progress-bar demo-ghost-bar" style="width:62%"></div>' +
			'</div></div>';
		screen.innerHTML = html;
	}

	function cleanup() {
		if (simInterval) { clearInterval(simInterval); simInterval = null; }
		if (chatInterval) { clearInterval(chatInterval); chatInterval = null; }
		if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
		countdownOverlay.classList.remove('active');
		distances = {};
		finished = {};
		finishOrder = [];
		chatMessages = [];
		lobbyJoined = [];
		lobbyReady = {};
		chatIdx = 0;
	}

	function enterPhase(phase) {
		if (phase === currentPhase) return;
		cleanup();
		currentPhase = phase;

		if (phase === 'lobby') {
			lobbyJoined = [PLAYERS[0]];
			renderLobby();
			setTimeout(function() { lobbyJoined.push(PLAYERS[1]); chatMessages.push(CHAT_LINES[0]); renderLobby(); }, 800);
			setTimeout(function() { lobbyJoined.push(PLAYERS[2]); renderLobby(); }, 1600);
			setTimeout(function() { lobbyJoined.push(PLAYERS[3]); chatMessages.push(CHAT_LINES[1]); renderLobby(); }, 2400);
		}

		if (phase === 'lobby-ready') {
			lobbyJoined = PLAYERS.slice();
			chatMessages = [CHAT_LINES[0], CHAT_LINES[1]];
			renderLobby();
			setTimeout(function() { lobbyReady['alice'] = true; renderLobby(); }, 600);
			setTimeout(function() { lobbyReady['bob'] = true; renderLobby(); }, 1200);
			setTimeout(function() { lobbyReady['carol'] = true; chatMessages.push(CHAT_LINES[2]); renderLobby(); }, 1800);
			setTimeout(function() { lobbyReady['you'] = true; renderLobby(); }, 2400);
		}

		if (phase === 'countdown') {
			lobbyJoined = PLAYERS.slice();
			for (var i = 0; i < PLAYERS.length; i++) lobbyReady[PLAYERS[i].id] = true;
			renderLobby();
			countdownOverlay.classList.add('active');
			var count = 3;
			countdownNum.textContent = count;
			countdownNum.classList.remove('go');
			countdownTimer = setInterval(function() {
				count--;
				if (count > 0) {
					countdownNum.textContent = count;
					countdownNum.classList.remove('go');
					countdownNum.style.animation = 'none'; countdownNum.offsetHeight; countdownNum.style.animation = '';
				} else if (count === 0) {
					countdownNum.textContent = 'GO!';
					countdownNum.classList.add('go');
					countdownNum.style.animation = 'none'; countdownNum.offsetHeight; countdownNum.style.animation = '';
				} else {
					clearInterval(countdownTimer); countdownTimer = null;
					countdownOverlay.classList.remove('active');
				}
			}, 1000);
		}

		if (phase === 'racing') {
			for (var i = 0; i < PLAYERS.length; i++) distances[PLAYERS[i].id] = 150 + Math.random() * 200;
			chatMessages = [CHAT_LINES[3], CHAT_LINES[4]];
			chatIdx = 5;
			renderRacing();
			simInterval = setInterval(function() {
				var allDone = true;
				for (var i = 0; i < PLAYERS.length; i++) {
					var p = PLAYERS[i];
					if (finished[p.id]) continue;
					var spd = speeds[p.id]; var v = variance[p.id];
					var delta = spd + (Math.random() - 0.5) * v * 2;
					distances[p.id] = Math.min((distances[p.id] || 0) + delta * 2, TARGET);
					if (distances[p.id] >= TARGET) { finished[p.id] = true; finishOrder.push(p.id); }
					else allDone = false;
				}
				renderRacing();
				if (allDone) { clearInterval(simInterval); simInterval = null; }
			}, 400);
			chatInterval = setInterval(function() {
				if (chatIdx < CHAT_LINES.length) { chatMessages.push(CHAT_LINES[chatIdx]); chatIdx++; }
			}, 2500);
		}

		if (phase === 'finished') {
			finishOrder = ['alice', 'you', 'bob', 'carol'];
			for (var i = 0; i < PLAYERS.length; i++) { distances[PLAYERS[i].id] = TARGET; finished[PLAYERS[i].id] = true; }
			renderFinished();
		}

		if (phase === 'ghost') { renderGhost(); }
	}

	// IntersectionObserver for scroll-driven phase changes
	var sections = document.querySelectorAll('.feature-section');
	var observer = new IntersectionObserver(function(entries) {
		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				var phase = entry.target.getAttribute('data-phase');
				if (phase) enterPhase(phase);
			}
		}
	}, { threshold: 0.4 });
	for (var i = 0; i < sections.length; i++) observer.observe(sections[i]);

	// Mobile: clone phone into each section
	var mobilePhones = document.querySelectorAll('.mobile-phone');
	for (var i = 0; i < mobilePhones.length; i++) {
		var section = mobilePhones[i].closest('.feature-section');
		var phase = section ? section.getAttribute('data-phase') : '';
		mobilePhones[i].innerHTML = '<div class="phone-frame" style="width:240px;height:480px;margin:0 auto;">' +
			'<div class="phone-notch"></div>' +
			'<div class="phone-screen" style="padding:32px 12px 12px;font-size:0.72rem;" data-mobile-phase="' + phase + '"></div></div>';
	}

	enterPhase('lobby');
})();
</script>
</body>
</html>`;
}
