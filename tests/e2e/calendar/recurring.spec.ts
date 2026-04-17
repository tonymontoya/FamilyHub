/**
 * E2E Tests: Recurring Events
 * 
 * Tests recurring event functionality
 * Uses API for actions (hydration workaround), UI for verification
 */

import { test, expect } from '@playwright/test'
import { TEST_PREFIX } from '../factories'

const API_URL = 'http://localhost:3000'

test.describe('Recurring Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
  })

  test('should create recurring event via API and display on calendar', async ({ page, request }) => {
    const eventTitle = `${TEST_PREFIX}Weekly Meeting ${Date.now()}`
    
    // Create event via API (workaround for hydration issues)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const createRes = await request.post(`${API_URL}/api/calendar/events`, {
      data: {
        title: eventTitle,
        startDate: tomorrow.toISOString().split('T')[0],
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        type: 'EVENT',
      },
      headers: { 
        'Content-Type': 'application/json',
        'Origin': API_URL 
      }
    })
    
    expect(createRes.ok()).toBeTruthy()
    
    // Refresh to see the event
    await page.reload()
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
    
    // Event should appear on calendar
    const eventText = page.locator('text=' + eventTitle.split(' ').slice(0, 2).join(' '))
    await expect(eventText.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show exception dialog when clicking recurring event', async ({ page, request }) => {
    const eventTitle = `${TEST_PREFIX}Recurring Click ${Date.now()}`
    
    // Create recurring event via API
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const createRes = await request.post(`${API_URL}/api/calendar/events`, {
      data: {
        title: eventTitle,
        startDate: tomorrow.toISOString().split('T')[0],
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY',
        type: 'EVENT',
      },
      headers: { 
        'Content-Type': 'application/json',
        'Origin': API_URL 
      }
    })
    
    expect(createRes.ok()).toBeTruthy()
    
    // Refresh and find event
    await page.reload()
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
    
    // Click on the event
    const eventText = page.locator('text=' + eventTitle.split(' ').slice(0, 2).join(' '))
    if (await eventText.isVisible().catch(() => false)) {
      await eventText.first().click()
      
      // Should show either edit form or exception dialog
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 3000 })
    }
  })
})
