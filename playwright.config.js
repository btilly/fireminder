// @ts-check
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run sequentially - tests share state
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 390, height: 844 }, // iPhone 14 Pro size
      },
    },
  ],

  // Expect the dev server to be running
  webServer: {
    command: 'python3 -m http.server 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});

