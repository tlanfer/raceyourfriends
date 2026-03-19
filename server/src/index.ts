import { createServer } from 'http';
import { setupWebSocketServer } from './ws.js';
import { getSpectatorHtml } from './spectator-page.js';
import { getLandingHtml } from './landing-page.js';

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
	// CORS headers for health check
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	if (req.url === '/health') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ status: 'ok' }));
		return;
	}

	const pathname = new URL(req.url || '/', `http://${req.headers.host}`).pathname;

	// Landing page at root
	if (req.method === 'GET' && pathname === '/') {
		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		res.end(getLandingHtml());
		return;
	}

	// Spectator page at /watch
	if (req.method === 'GET' && pathname.startsWith('/watch')) {
		res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
		res.end(getSpectatorHtml());
		return;
	}

	res.writeHead(404);
	res.end('Not found');
});

setupWebSocketServer(server);

server.listen(PORT, () => {
	console.log(`WebSocket server running on port ${PORT}`);
});
