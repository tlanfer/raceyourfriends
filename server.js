// Production server entry point
import { createServer } from 'http';
import { handler } from './build/handler.js';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(handler);

// Dynamically import ws setup
const { setupWebSocketServer } = await import('./build/server/chunks/ws.js').catch(() => {
	// Fallback: ws module might be bundled differently
	console.warn('Could not load ws module from build output');
	return { setupWebSocketServer: () => {} };
});

setupWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
