import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
const port = Number(process.env.PLAYWRIGHT_PORT || 5173);
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 150000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-webgl'],
    },
  },
  projects: [
    { name: 'canvas' },
    { name: 'webgl', testMatch: ['**/interaction.spec.ts','**/gameplay.spec.ts','**/tutorial.spec.ts'], grep: /mouse:|prepara e entrega/, use: { launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'] } } },
  ],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  reporter: [['list'],['json',{outputFile:'test-results/browser-results.json'}]],
});
