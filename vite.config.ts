import path from 'node:path'
import { defineConfig } from 'vite'
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
