/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { clipManifestPlugin } from './vite/clipManifestPlugin.ts';

export default defineConfig({
  plugins: [react(), clipManifestPlugin()],
  build: {
    rolldownOptions: {
      output: {
        // Libraries change far less often than the app, so they get their own files: a
        // returning visitor keeps them cached across app updates, and no single file passes
        // Vite's 500 kB warning. Character data is already split per character.
        codeSplitting: {
          groups: [
            { name: 'mantine', test: /node_modules[\\/]@mantine/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
