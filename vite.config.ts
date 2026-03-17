import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';

function webSocketPlugin() {
	return {
		name: 'websocket-server',
		configureServer(server: ViteDevServer) {
			if (!server.httpServer) return;

			// Dynamically import ws setup via vite's SSR module loader
			server.httpServer.once('listening', async () => {
				const mod = await server.ssrLoadModule('./src/lib/server/ws.ts');
				mod.setupWebSocketServer(server.httpServer);
				console.log('WebSocket server attached');
			});
		}
	};
}

export default defineConfig({
	plugins: [sveltekit(), webSocketPlugin()],
	test: {
		include: ['src/**/*.test.ts']
	}
});
