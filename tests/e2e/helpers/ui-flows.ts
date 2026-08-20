import { expect, type Browser, type Page, type APIRequestContext } from '@playwright/test'

/**
 * Shared helpers for UI-level E2E specs.
 *
 * Parents are provisioned through the real API (register -> sign-in ->
 * setup-family) and then authenticated in the browser via the real login
 * form, so specs exercise the same paths a user would.
 */

const API_URL = 'http://localhost:3000'
const ORIGIN = { Origin: API_URL }

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Register a fresh parent + family through the API and return credentials.
 */
export async function provisionParentViaApi(
  request: APIRequestContext,
  unique: string
): Promise<{ email: string; password: string }> {
  const email = `e2e-ui-${unique}@test.com`
  const password = 'TestPass123!'

  await request.post(`${API_URL}/api/auth/sign-up/email`, {
    data: { email, password, name: 'UI Parent' },
    headers: ORIGIN,
  })
  const signIn = await request.post(`${API_URL}/api/auth/sign-in/email`, {
    data: { email, password },
    headers: ORIGIN,
  })
  expect(signIn.ok(), `parent sign-in failed: ${await signIn.text()}`).toBeTruthy()

  const setup = await request.post(`${API_URL}/api/auth/setup-family`, {
    data: { familyName: 'UI Family', parentName: 'UI Parent' },
    headers: ORIGIN,
  })
  expect(setup.ok(), `setup-family failed: ${await setup.text()}`).toBeTruthy()

  return { email, password }
}

/**
 * Create a page in a FRESH context (no shared storageState).
 *
 * The playwright projects pre-authenticate every test as the shared E2E
 * parent; specs that provision their own parent via the API must use this
 * instead of the injected `page`, or /login will redirect away.
 */
export async function freshPage(browser: Browser): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext()
  const page = await context.newPage()
  return { page, close: () => context.close() }
}

/**
 * Authenticate the browser page as an existing user via the login form.
 */
export async function signInViaUi(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/**
 * Assert a sonner toast with the given text is shown.
 * `type` defaults to 'success'; use 'error' for failure toasts.
 */
export function expectToast(page: Page, text: string | RegExp, type: 'success' | 'error' = 'success') {
  return expect(
    page.locator(`[data-sonner-toast][data-type="${type}"]`, { hasText: text })
  ).toBeVisible({ timeout: 10000 })
}
