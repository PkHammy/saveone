import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
        warn(warning);
      },
    },
  },
  plugins: [
    {
      name: 'game-catalogue',
      closeBundle() {
        cpSync('data', 'dist/data', { recursive: true });
      },
    },
  ],
});
