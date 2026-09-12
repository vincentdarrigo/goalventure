import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    // Defensive: a stray `npm run build` previously left compiled *.test.js
    // files under dist/, which got picked up alongside the real src/ tests
    // and silently doubled every test count. tsconfig.build.json now keeps
    // dist/ test-free, but excluding it here too means that class of bug
    // can't recur even if the build config changes again later.
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
