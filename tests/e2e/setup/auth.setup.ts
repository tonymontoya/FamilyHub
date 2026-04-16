import { test as setup, expect } from '@playwright/test'

/**
 * Auth Setup for E2E Tests
 * 
 * This file runs before all other tests to create authenticated sessions.
 * Sessions are saved to JSON files and reused across tests for speed.
 * 
 * Pattern: https://playwright.dev/docs/auth#reuse-signed-in-state
 */

const parentAuthFile = 'playwright/.auth/parent.json'
const childAuthFile = 'playwright/.auth/child.json'

// Use timestamp to create unique test users each run
const timestamp = Date.now()
const TEST_PARENT = {
  email: `test-parent-${timestamp}@example.com`,
  password: 'TestPass123!',
  familyName: `Test Family ${timestamp}`,
  parentName: 'Test Parent',
}

const TEST_CHILD = {
  username: `test-child-${timestamp}`,
  password: 'ChildPass123!',
}

/**
 * Setup: Create parent account and authenticate
 * This creates the parent.json storage state
 */
setup('authenticate as parent', async ({ page }) => {
  // Navigate to registration
  await page.goto('/register')
  
  // Fill registration form
  await page.getByLabel('Family Name').fill(TEST_PARENT.familyName)
  await page.getByLabel('Your Name').fill(TEST_PARENT.parentName)
  await page.getByLabel('Email').fill(TEST_PARENT.email)
  await page.getByLabel('Password').fill(TEST_PARENT.password)
  
  // Submit form
  await page.getByRole('button', { name: 'Create Account' }).click()
  
  // Wait for redirect to dashboard (indicates success)
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  
  // Verify we're logged in by checking for logout button
  await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  
  // Save the authenticated state
  await page.context().storageState({ path: parentAuthFile })
  
  console.log(`✓ Parent auth saved to ${parentAuthFile}`)
})

/**
 * Setup: Create child account and authenticate
 * This creates the child.json storage state
 * 
 * Note: Child accounts require parent to create them first (Issue #5).
 * For now, we skip child auth setup until #5 is implemented.
 */
setup.skip('authenticate as child', async ({ page }) => {
  // This will be implemented after Issue #5 (Child Account Creation)
  // For now, tests requiring child auth should use page.goto('/login') flow
  
  await page.goto('/login')
  
  // Child login flow (may differ from parent)
  await page.getByLabel('Username').fill(TEST_CHILD.username)
  await page.getByLabel('Password').fill(TEST_CHILD.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  
  await expect(page).toHaveURL('/dashboard')
  
  await page.context().storageState({ path: childAuthFile })
  
  console.log(`✓ Child auth saved to ${childAuthFile}`)
})
