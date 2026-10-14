import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**', 'e2e/**', 'output/**'],
    maxWorkers: 2
  }
});
