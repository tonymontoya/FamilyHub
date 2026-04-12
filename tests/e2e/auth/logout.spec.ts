import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Logout Flow
 * 
 * Tests session termination:
 * - Logout redirects to login
 * - Protected routes require re-authentication
 * 
 * Uses pre-authenticated state from auth.setup.ts
 */

test.describe('Logout Flow', () => {
  // This test uses the pre-authenticated parent state
  // Configured in playwright.config.ts: storageState: 'playwright/.auth/parent.json'

  test('should logout and redirect to login', async ({ page }) => {
    // Start on dashboard (pre-authenticated)
    await page.goto('/dashboard')
    
    // Verify we're logged in
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
    
    // Click logout
    await page.getByRole('button', { name: /sign out/i }).click()
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    
    // Verify logout message or login form visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should require re-authentication after logout', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill('test-parent@example.com')
    await page.getByLabel('Password').fill('TestPass123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    
    // Logout
    await page.getByRole('button', { name: /sign out/i }).click()
    await page.waitForURL('/login')
    
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
