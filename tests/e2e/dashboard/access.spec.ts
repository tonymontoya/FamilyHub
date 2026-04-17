import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Dashboard Access Control
 * 
 * Tests authenticated dashboard functionality:
 * - Dashboard loads for authenticated users
 * - User info displayed correctly
 * - Navigation elements present
 * 
 * Uses pre-authenticated state from auth.setup.ts
 */

test.describe('Dashboard Access', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (already authenticated via storageState)
    await page.goto('/dashboard')
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded')
  })

  test('should show dashboard to authenticated users', async ({ page }) => {
    // Verify dashboard URL (not redirected to login)
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display user menu in header', async ({ page }) => {
    // The user menu button should exist with the user name in aria-label
    const userMenu = page.getByRole('button', { name: /user menu.*e2e test parent/i })
    await expect(userMenu).toBeVisible()
    // The button shows initials "ET" for "E2E Test Parent"
    await expect(userMenu).toContainText('ET')
  })

  test('should show dashboard navigation', async ({ page }) => {
    // Sidebar navigation should be visible
    await expect(page.getByRole('complementary', { name: /main navigation/i })).toBeVisible()
    
    // Nav links should be present
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Chores' })).toBeVisible()
  })
})
