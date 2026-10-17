import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5179,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    // Source maps add ~2 MB of unreadable output to the deploy. Enable
    // temporarily when debugging a production build.
    sourcemap: false,
  },
});