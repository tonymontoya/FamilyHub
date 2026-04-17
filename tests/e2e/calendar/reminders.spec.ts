/**
 * E2E Tests: Event Reminders
 * 
 * Tests reminder functionality
 * Uses API for actions (hydration workaround), UI for verification
 */

import { test, expect } from '@playwright/test'
import { TEST_PREFIX } from '../factories'

const API_URL = 'http://localhost:3000'

test.describe('Event Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
  })

  test('should add reminder to event via API', async ({ page, request }) => {
    const eventTitle = `${TEST_PREFIX}Event With Reminder ${Date.now()}`
    
    // Create event via API
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const createRes = await request.post(`${API_URL}/api/calendar/events`, {
      data: {
        title: eventTitle,
        startDate: tomorrow.toISOString().split('T')[0],
        type: 'EVENT',
      },
      headers: { 
        'Content-Type': 'application/json',
        'Origin': API_URL 
      }
    })
    
    expect(createRes.ok()).toBeTruthy()
    const createData = await createRes.json()
    const eventId = createData.id || createData.data?.id || createData.event?.id
    
    expect(eventId).toBeTruthy()
    
    // Add reminder via API
    const reminderRes = await request.post(`${API_URL}/api/calendar/events/${eventId}/reminders`, {
      data: {
        minutesBefore: 15,
        type: 'BROWSER',
      },
      headers: { 
        'Content-Type': 'application/json',
        'Origin': API_URL 
      }
    })
    
    expect(reminderRes.ok()).toBeTruthy()
    
    // Refresh and verify event appears
    await page.reload()
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
    
    // Event should be visible
    const eventText = page.locator('text=' + eventTitle.split(' ').slice(0, 2).join(' '))
    await expect(eventText.first()).toBeVisible({ timeout: 5000 })
  })

  test('notification bell is visible', async ({ page }) => {
    // The notification bell should be visible in the header
    const notificationBell = page.locator('header button[aria-label*="notification" i]').first()
    await expect(notificationBell).toBeVisible()
    
    // Verify it has the correct aria-label
    const ariaLabel = await notificationBell.getAttribute('aria-label')
    expect(ariaLabel?.toLowerCase()).toContain('notification')
  })
})
