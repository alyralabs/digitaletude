import path from 'node:path'
import { defineConfig } from 'vitest/config'
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
