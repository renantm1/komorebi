import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
const port = Number(process.env.PWA_PORT || 4175);
export default defineConfig({
  testDir: './tests/pwa', outputDir: './test-results/pwa', workers: 1, fullyParallel: false, timeout: 90000,
  use: {
    baseURL: `http://127.0.0.1:${port}/komorebi/`,
    viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'] },
  },
  webServer: { command: 'node scripts/serve-pwa.mjs', url: `http://127.0.0.1:${port}/komorebi/`, reuseExistingServer: !process.env.CI }, reporter: [['list'],['json',{outputFile:'test-results/pwa-results.json'}]],
});
