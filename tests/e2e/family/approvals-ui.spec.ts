import { test, expect, request as playwrightRequest } from '@playwright/test'
import { provisionParentViaApi, signInViaUi, expectToast, freshPage, uniqueSuffix } from '../helpers/ui-flows'

/**
 * UI safety net for the approvals screen (flat-envelope routes).
 *
 * Child + chore are provisioned through the API (cheap), but the approval
 * itself happens in the browser: the pending list, approve dialog, and
 * success toast all depend on the client correctly unwrapping
 * GET /api/completions and POST /api/completions/:id/approve responses.
 */

const API_URL = 'http://localhost:3000'
const ORIGIN = { Origin: API_URL }
const CHORE_POINTS = 25

test.describe('Approvals UI', () => {
  test('parent approves a child completion through the UI', async ({ browser, request }) => {
    const unique = uniqueSuffix()
    const childUsername = `apprkid${unique}`.slice(0, 20)
    const choreTitle = `Approval Chore ${unique}`

    // Provision: parent, child, assigned chore via API.
    const { email, password } = await provisionParentViaApi(request, unique)

    const createChildRes = await request.post(`${API_URL}/api/children`, {
      data: { username: childUsername, displayName: 'Approval Kid', password: 'KidPass123!' },
      headers: ORIGIN,
    })
    expect(createChildRes.status()).toBe(201)
    const child = (await createChildRes.json()).data.child

    const createChoreRes = await request.post(`${API_URL}/api/chores`, {
      data: {
        title: choreTitle,
        points: CHORE_POINTS,
        recurrenceRule: 'RRULE:FREQ=DAILY',
        assigneeId: child.id,
      },
      headers: ORIGIN,
    })
    expect(createChoreRes.status()).toBe(201)
    const chore = (await createChoreRes.json()).data

    // Child completes the chore via API in an isolated context.
    const childContext = await playwrightRequest.newContext({ baseURL: API_URL })
    try {
      const childSignIn = await childContext.post(`${API_URL}/api/auth/sign-in/username`, {
        data: { username: childUsername, password: 'KidPass123!' },
        headers: ORIGIN,
      })
      expect(childSignIn.ok()).toBeTruthy()

      const completeRes = await childContext.post(`${API_URL}/api/completions`, {
        multipart: { choreId: chore.id },
        headers: ORIGIN,
      })
      expect(completeRes.status()).toBe(201)
    } finally {
      await childContext.dispose()
    }

    // Parent reviews and approves through the UI.
    const { page, close } = await freshPage(browser)
    try {
      await signInViaUi(page, email, password)
      await page.goto('/family/approvals')

      const pendingCard = page.locator('div[data-slot="card"]', { hasText: choreTitle })
      await expect(pendingCard).toBeVisible({ timeout: 15000 })
      await expect(pendingCard.getByText('Approval Kid')).toBeVisible()

      await pendingCard.getByRole('button', { name: 'Approve' }).click()
      const approveDialog = page.locator('div[data-slot="dialog-content"]', { hasText: 'Approve Completion' })
      await expect(approveDialog).toBeVisible()
      await expect(approveDialog.getByLabel('Points to Award')).toHaveValue(String(CHORE_POINTS))
      await approveDialog.getByRole('button', { name: 'Approve' }).click()

      // The toast renders fields from the API response body.
      await expectToast(page, new RegExp(`Approval Kid.*earned.*${CHORE_POINTS} points`, 'i'))
      await expect(page.getByText('All caught up!')).toBeVisible({ timeout: 15000 })
    } finally {
      await close()
    }
  })
})
