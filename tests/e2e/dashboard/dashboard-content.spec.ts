import { test, expect } from '@playwright/test'
import { provisionParentViaApi, signInViaUi, freshPage, uniqueSuffix } from '../helpers/ui-flows'

/**
 * UI safety net for the dashboard data path (flat-envelope route).
 *
 * Uses its own provisioned parent (not the shared storageState user) so
 * the assertions are independent of other specs' API traffic against the
 * shared user's rate limits.
 */

test.describe('Dashboard content', () => {
  test('renders role-specific stats and cards from the API payload', async ({ browser, request }) => {
    const unique = uniqueSuffix()
    const { email, password } = await provisionParentViaApi(request, unique)
    const { page, close } = await freshPage(browser)
    try {
      await signInViaUi(page, email, password)
      await page.goto('/dashboard')

      // Parent stat cards (rendered from data.user.role and points data).
      await expect(page.getByText('Family Points')).toBeVisible({ timeout: 15000 })
      await expect(page.getByText("Today's Chores", { exact: true }).first()).toBeVisible()
      await expect(page.getByText('Pending Approvals').first()).toBeVisible()

      // Today's chores card renders the empty state from the payload.
      await expect(page.getByText('No chores scheduled for today')).toBeVisible()

      // Pending approvals card renders its empty state.
      await expect(page.getByText('No completions waiting for approval')).toBeVisible()

      // Meta footer renders from data.meta.lastUpdated.
      await expect(page.getByText(/Last updated:/i)).toBeVisible()
    } finally {
      await close()
    }
  })
})
