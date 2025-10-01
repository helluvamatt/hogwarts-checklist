import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true // Disable legacy Svelte features
  },
  kit: {
    adapter: adapter()
  }
  // Path aliases are handled by https://svelte.dev/docs/kit/configuration#alias
  // except $lib which is handled by https://svelte.dev/docs/kit/configuration#files
};

export default config;
