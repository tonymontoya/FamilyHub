import { test, expect } from '@playwright/test'
import { provisionParentViaApi, signInViaUi, expectToast, freshPage, uniqueSuffix } from '../helpers/ui-flows'

/**
 * UI safety net for the chores management screens (flat-envelope routes).
 *
 * Written BEFORE the response-envelope migration: these specs assert
 * user-visible outcomes (chore card appears, toasts render server error
 * messages, list refreshes after archive) rather than response shapes, so
 * they must stay green while /api/chores and its clients move to the
 * unified envelope.
 */

test.describe('Chores management UI', () => {
  test('create, error toast, and archive via the UI', async ({ browser, request }) => {
    const unique = uniqueSuffix()
    const choreTitle = `UI Chore ${unique}`
    const { email, password } = await provisionParentViaApi(request, unique)
    const { page, close } = await freshPage(browser)
    try {
      await signInViaUi(page, email, password)

      // 1. Create a chore through the form.
      await page.goto('/chores/new')
      await page.waitForLoadState('networkidle')
      await page.getByLabel('Title').fill(choreTitle)
      await page.getByRole('button', { name: 'Create Chore' }).click()

      await expect(page).toHaveURL(/\/chores$/, { timeout: 15000 })
      await expectToast(page, 'Chore created successfully!')
      await expect(page.getByRole('heading', { name: choreTitle })).toBeVisible()
      await expect(page.getByText('10 pts')).toBeVisible() // default points value

      // 2. Network failure while creating: the fetch throws and the UI must
      //    surface the generic error toast without crashing.
      await page.route('**/api/chores', (route) =>
        route.request().method() === 'POST' ? route.abort() : route.continue()
      )
      await page.goto('/chores/new')
      await page.waitForLoadState('networkidle')
      await page.getByLabel('Title').fill(`Broken Chore ${unique}`)
      await page.getByRole('button', { name: 'Create Chore' }).click()

      await expectToast(page, /something went wrong/i, 'error')
      await expect(page).toHaveURL(/\/chores\/new$/)
      await page.unrouteAll({ behavior: 'ignoreErrors' })

      // 3. Archive the chore via the confirmation dialog.
      await page.goto('/chores')
      const card = page.locator('div[data-slot="card"]', { hasText: choreTitle })
      await expect(card).toBeVisible()
      await card.getByRole('button', { name: 'Archive' }).click()
      await page.getByRole('button', { name: 'Archive', exact: true }).click()

      await expectToast(page, 'Chore archived')
      await expect(page.getByRole('heading', { name: choreTitle })).not.toBeVisible()
      await expect(page.getByText('No chores yet')).toBeVisible()
    } finally {
      await close()
    }
  })
})
