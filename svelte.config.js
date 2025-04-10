import adapter from '@sveltejs/adapter-static'; // ← Add this
import { vitePreprocess } from '@sveltejs/kit/vite';

export default {
  kit: {
    adapter: adapter({
      fallback: 'index.html' // ← Required for SPA mode
    }),
    prerender: {
      entries: [] // ← Disable prerendering
    }
  },
  preprocess: vitePreprocess()
};