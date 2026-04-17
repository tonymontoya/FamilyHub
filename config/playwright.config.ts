import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

/**
 * Playwright configuration for E2E tests
 * 
 * IMPORTANT: This config expects a running dev server on localhost:3000
 * Start the server before running tests: npm run dev
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '../tests/e2e',
  outputDir: '../test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Serial execution for auth stability
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Slower navigation for stability
    actionTimeout: 10000,
    navigationTimeout: 15000,
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
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/parent.json',
      },
      dependencies: ['setup'],
    },
  ],

  // No webServer - expects dev server to be running
  // Start manually with: npm run dev
})
