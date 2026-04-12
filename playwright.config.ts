import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Screenshot on failure for debugging
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup - runs first to create authenticated state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test projects - reuse auth state
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use pre-authenticated state
        storageState: 'playwright/.auth/parent.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/parent.json',
      },
      dependencies: ['setup'],
    },
    // Child-specific tests use different auth
    {
      name: 'chromium-child',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/child.json',
      },
      testMatch: /.*child.*\.spec\.ts/,
      dependencies: ['setup'],
    },
  ],

  webServer: {
    // Use production build for more reliable tests
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for build
  },
})
