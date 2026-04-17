import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3000'

async function createTestUser(request: any) {
  const email = `e2e-cal-${Date.now()}@test.com`
  const password = 'TestPass123!'
  
  await request.post(`${API_URL}/api/auth/sign-up/email`, {
    data: { email, password, name: 'Calendar Test' }
  })
  
  await request.post(`${API_URL}/api/auth/sign-in/email`, {
    data: { email, password }
  })
  
  await request.post(`${API_URL}/api/auth/setup-family`, {
    data: { familyName: 'Cal Family', parentName: 'Calendar Test' }
  })
  
  return { email, password }
}

test.describe('Calendar Navigation', () => {
  test.beforeEach(async ({ request }) => {
    await createTestUser(request)
  })

  test('should show calendar page to authenticated users', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    await expect(page.getByText('Manage family events')).toBeVisible()
  })

  test('should show New Event button', async ({ page }) => {
    await page.goto('/calendar')
    const newEventButton = page.locator('[data-testid="new-event-button"]')
    await expect(newEventButton).toBeVisible()
    await expect(newEventButton).toContainText('New Event')
  })
})
