import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'$workers': path.resolve('./src/lib/workers'),
			'$lib': path.resolve('./src/lib')
	}
	},
	build: {
		target: 'esnext',
		sourcemap: false,
		minify: true,
		rollupOptions: {
			external: [],
			output: {
				manualChunks: undefined
			}
		}
	},
	server: {
		fs: {
			// Allow serving files from static directory
			allow: ['..']
		}
	},
	publicDir: 'static',
	optimizeDeps: {
		include: ['rollup']
	}
});
