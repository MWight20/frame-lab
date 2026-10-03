/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { clipManifestPlugin } from './vite/clipManifestPlugin';

export default defineConfig({
  plugins: [react(), clipManifestPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
