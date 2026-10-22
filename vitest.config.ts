import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
import { preFormatRoot, preFormatSuites } from './scripts/pre-format-baseline.mjs';

const shared = { environment: 'node' as const, testTimeout: 15_000 };

export default defineConfig({
  test: {
    projects: [
      { test: { ...shared, name: 'current', include: ['tests/**/*.test.ts'],
        exclude: [...configDefaults.exclude, ...preFormatSuites] } },
      {
        root: preFormatRoot,
        cacheDir: fileURLToPath(new URL('./node_modules/.vite/pre-format', import.meta.url)),
        test: { ...shared, name: 'v0.6.0-pre-format', pool: 'forks', include: preFormatSuites,
          setupFiles: [fileURLToPath(new URL('./tests/setup/pre-format-baseline.ts', import.meta.url))] },
      },
    ],
  },
});
