import { defineConfig, devices } from '@playwright/test'

// Fake Supabase origin baked into the app at dev/build time. Every request
// to it is intercepted in e2e/fixtures.ts, so tests run fully offline and
// never read .env or touch the real project.
const STUB_ENV = {
  VITE_SUPABASE_URL: 'https://stub.supabase.test',
  VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
  VITE_PRIMEUI_LICENSE: '',
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      // Dev server keeps StrictMode's double-mount — the bug class that
      // crashed the visualizer on open only exists here.
      name: 'dev',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5199' },
    },
    {
      // The minified production bundle — what actually ships.
      name: 'preview',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4199' },
    },
    {
      // Same production bundle under the Safari engine — exercises the
      // AudioContext-suspend guard Chromium never touches. Canvas-liveness
      // assertions are Chromium-only (see visualizer.spec.ts).
      name: 'preview-webkit',
      use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:4199' },
    },
  ],
  webServer: [
    {
      // Through yarn: node_modules/.bin isn't on the PATH Playwright spawns
      // with, so a bare `vite` binary name would fail to launch.
      command: 'yarn vite dev --port 5199 --strictPort',
      url: 'http://localhost:5199',
      env: STUB_ENV,
      timeout: 120_000,
      // Never reuse: a dev server you started yourself carries the real
      // .env, and these tests must only ever see the stub origin.
      reuseExistingServer: false,
    },
    {
      command:
        'yarn vite build --outDir dist-e2e && yarn vite preview --outDir dist-e2e --port 4199 --strictPort',
      url: 'http://localhost:4199',
      env: STUB_ENV,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
})
