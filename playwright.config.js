// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Deteksi otomatis binary Chrome for Testing lokal
const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
const localChromePath = path.join(localAppData, 'ms-playwright', 'chromium-1248', 'chrome-win64', 'chrome.exe');
const executablePath = fs.existsSync(localChromePath) ? localChromePath : undefined;

/**
 * POS BY SONGER CREATIVE - PLAYWRIGHT E2E CONFIGURATION
 * Configured strictly for headless testing with built-in lightweight webServer.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          ...(executablePath ? { executablePath } : {}),
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      }
    }
  ],

  /* Server HTTP lokal otomatis dijalankan sebelum pengujian dan dimatikan sesudahnya */
  webServer: {
    command: 'node tests/fixtures/test-server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 10000
  }
});
