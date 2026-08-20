import { test, expect } from '@playwright/test'
import { provisionParentViaApi, signInViaUi, expectToast, freshPage, uniqueSuffix } from '../helpers/ui-flows'

/**
 * UI safety net for child account management (flat-envelope routes).
 *
 * Asserts user-visible outcomes across POST/DELETE /api/children and
 * POST /api/children/:id/reset-password: credentials dialog content,
 * generated-password dialog, list refresh after delete.
 */

test.describe('Children management UI', () => {
  test('create child, reset password, and delete via the UI', async ({ browser, request }) => {
    const unique = uniqueSuffix()
    const childUsername = `uichild${unique}`.slice(0, 20)
    const childDisplayName = `UI Kid ${unique}`
    const { email, password } = await provisionParentViaApi(request, unique)
    const { page, close } = await freshPage(browser)
    try {
      await signInViaUi(page, email, password)

      // 1. Create a child through the form; the credentials dialog must show
      //    the username and generated password returned by the API.
      await page.goto('/family/children/new')
      await page.getByLabel('Username').fill(childUsername)
      await page.getByLabel('Display Name').fill(childDisplayName)
      await page.getByLabel('Initial Password').fill('KidPass123!')
      await page.getByRole('button', { name: 'Create Account' }).click()

      const dialog = page.locator('div[data-slot="dialog-content"]', { hasText: 'Account Created!' })
      await expect(dialog).toBeVisible({ timeout: 15000 })
      await expect(dialog.locator('input').first()).toHaveValue(childUsername)
      await expect(dialog.locator('input').nth(1)).toHaveValue('KidPass123!')
      await dialog.getByRole('button', { name: "I've Saved It" }).click()

      await expect(page).toHaveURL(/\/family\/children$/)
      await expect(page.getByText(childDisplayName)).toBeVisible()
      await expect(page.getByText(`Username: ${childUsername}`)).toBeVisible()

      // 2. Duplicate username: the server rejects with 409 and the UI must
      //    surface the error in a toast and stay on the form.
      await page.goto('/family/children/new')
      await page.getByLabel('Username').fill(childUsername)
      await page.getByLabel('Display Name').fill('Duplicate Kid')
      await page.getByLabel('Initial Password').fill('KidPass123!')
      await page.getByRole('button', { name: 'Create Account' }).click()

      await expectToast(page, /already exists/i, 'error')
      await expect(page).toHaveURL(/\/family\/children\/new$/)
      await page.goto('/family/children')

      // 3. Reset the password: the API returns a new password that the UI
      //    must surface in the one-time dialog.
      const childRow = page.locator('div.rounded-lg.border', { hasText: childUsername })
      await childRow.getByRole('button', { name: 'Reset Password' }).click()

      const resetDialog = page.locator('div[data-slot="alert-dialog-content"]', { hasText: 'Password Reset Successful' })
      await expect(resetDialog).toBeVisible({ timeout: 15000 })
      const newPassword = resetDialog.locator('code.font-mono')
      await expect(newPassword).not.toHaveText('')
      await resetDialog.getByRole('button', { name: "I've Saved It" }).click()
      await expect(resetDialog).not.toBeVisible()

      // 4. Delete the child account via the confirmation dialog.
      await childRow.getByRole('button', { name: 'Remove' }).click()
      await page.getByRole('button', { name: 'Delete Account' }).click()

      await expectToast(page, 'Child account deleted')
      await expect(page.getByText(childDisplayName)).not.toBeVisible()
      await expect(page.getByText('No child accounts yet')).toBeVisible()
    } finally {
      await close()
    }
  })
})
