const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://hapo3005.github.io/hoy/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 12_000,
    navigationTimeout: 30_000
  },
  outputDir: 'test-results',
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
      }
    },
    {
      name: 'mobile-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
      }
    },
    {
      name: 'desktop-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 1000 }
      }
    }
  ]
});
