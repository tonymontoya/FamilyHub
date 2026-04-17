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

test.describe('Calendar Events', () => {
  test.beforeEach(async ({ request }) => {
    await createTestUser(request)
  })

  test('should show event form when clicking New Event', async ({ page }) => {
    await page.goto('/calendar')
    await page.locator('[data-testid="new-event-button"]').click()
    await expect(page.locator('[data-testid="event-form-dialog"]')).toBeVisible()
  })

  test('should create a new event via API', async ({ request }) => {
    // Create event via API
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const response = await request.post(`${API_URL}/api/calendar/events`, {
      data: {
        title: 'Test Event',
        startDate: tomorrow.toISOString().split('T')[0],
        type: 'EVENT'
      }
    })
    
    expect(response.ok()).toBeTruthy()
  })
})
