import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.WEBKIT_PORT || 4176);
export default defineConfig({
 testDir:'./tests/webkit',outputDir:'./test-results/webkit',workers:1,timeout:120000,
 use:{...devices['iPhone 13'],browserName:'webkit',viewport:{width:844,height:390},baseURL:`http://127.0.0.1:${port}/komorebi/`,headless:true},
 webServer:{command:`PWA_PORT=${port} node scripts/serve-pwa.mjs`,url:`http://127.0.0.1:${port}/komorebi/`,reuseExistingServer:!process.env.CI},reporter:[['list'],['json',{outputFile:'test-results/webkit-results.json'}]],
});
