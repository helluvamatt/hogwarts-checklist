import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';

import pkg from './package.json' assert { type: 'json' }

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  define: {
    // Must be string literals
		APP_AUTHOR: `"${pkg.author.name}"`,
    APP_VERSION: `"${pkg.version}"`,
		APP_BUGS_URL: `"${pkg.bugs.url}"`,
    APP_REPOSITORY_URL: `"${pkg.repository.url}"`
	},
});
