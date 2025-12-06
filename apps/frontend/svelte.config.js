import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		enableSourcemap: true
	},
	kit: {
		// Force a Vercel-supported Node runtime for the Serverless Function
		adapter: adapter({ runtime: 'nodejs20.x' }),
		typescript: {
			config: (config) => {
				config.compilerOptions = {
					...config.compilerOptions,
					allowJs: true,
					checkJs: true,
					esModuleInterop: true,
					forceConsistentCasingInFileNames: true,
					resolveJsonModule: true,
					skipLibCheck: true,
					sourceMap: true,
					strict: true,
					moduleResolution: 'bundler'
				};
				return config;
			}
		}
	}
};

export default config;
