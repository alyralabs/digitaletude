import path from 'node:path'
import { defaultExclude, defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Vitest's default include matches *.spec.ts anywhere in the repo, which
    // would otherwise sweep up the Playwright specs under e2e/ and try to
    // run them in jsdom. Spread the defaults rather than replace them —
    // `exclude` isn't merged with vitest's own list, only assigning it.
    exclude: [...defaultExclude, 'e2e/**'],
    // Without this, Vitest's SSR externalization can bypass the
    // '@primeicons/react/core' alias below for whichever icon module is
    // resolved first in a given run — inlining forces every icon through
    // Vite's own resolve pipeline, where the alias reliably applies.
    server: {
      deps: {
        inline: ['@primeicons/react'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // @primeicons/react@8.0.0-alpha.1 ships a broken exports map: "./core" points
      // to dist/esm/core.mjs but the file is dist/esm/core/index.mjs; remove once fixed upstream
      '@primeicons/react/core': path.resolve(
        __dirname,
        'node_modules/@primeicons/react/dist/esm/core/index.mjs',
      ),
    },
  },
})
