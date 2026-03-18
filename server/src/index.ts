import { createServer } from 'http';
import { setupWebSocketServer } from './ws.js';
import { getSpectatorHtml } from './spectator-page.js';

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

	// Serve spectator page at root and /watch paths
	const pathname = new URL(req.url || '/', `http://${req.headers.host}`).pathname;
	if (req.method === 'GET' && (pathname === '/' || pathname.startsWith('/watch'))) {
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
