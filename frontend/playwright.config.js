import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/automation',
  timeout: 30000,
  expect: { timeout: 5000 },
  // Configure the HTML reporter to write a full diagnostic index to a localized directory
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    headless: false,
    screenshot: 'on',
    video: 'on-first-retry',
    trace: 'on',
  },
});