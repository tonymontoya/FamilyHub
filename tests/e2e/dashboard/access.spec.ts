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
  // These tests use the pre-authenticated parent state

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (already authenticated via storageState)
    await page.goto('/dashboard')
  })

  test('should show dashboard to authenticated users', async ({ page }) => {
    // Verify dashboard URL
    await expect(page).toHaveURL('/dashboard')
    
    // Verify dashboard heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    
    // Verify dashboard content sections
    await expect(page.getByText('Quick Actions')).toBeVisible()
    await expect(page.getByText('Family Overview')).toBeVisible()
  })

  test('should display logout button in header', async ({ page }) => {
    const logoutButton = page.getByRole('button', { name: /sign out/i })
    await expect(logoutButton).toBeVisible()
    await expect(logoutButton).toBeEnabled()
  })

  test('should show welcome message with user context', async ({ page }) => {
    // The dashboard should show welcome back text
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Should show the parent name from setup
    await expect(page.getByText(/test parent/i)).toBeVisible()
  })

  test('should show placeholder content for upcoming features', async ({ page }) => {
    // Verify placeholders indicate future features
    await expect(page.getByText(/add family members.*coming soon/i)).toBeVisible()
    await expect(page.getByText(/create chores.*coming soon/i)).toBeVisible()
    await expect(page.getByText(/view completions.*coming soon/i)).toBeVisible()
  })
})
