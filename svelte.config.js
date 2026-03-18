import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';

const isCapacitor = process.env.SVELTE_CONFIG === 'capacitor';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: isCapacitor
		? {
				adapter: adapterStatic({
					pages: 'build-static',
					assets: 'build-static',
					fallback: 'index.html',
					strict: false
				}),
				prerender: {
					entries: []
				}
			}
		: {
				adapter: adapterNode()
			},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
