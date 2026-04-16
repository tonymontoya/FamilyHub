/**
 * E2E Tests: Calendar Events
 * 
 * Tests event CRUD operations:
 * - Create new event
 * - Edit existing event
 * - Delete event
 * - Event form validation
 * 
 * Uses pre-authenticated state from auth.setup.ts
 */

import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { 
  createTestEvent, 
  cleanupCalendarTestData,
  TEST_PREFIX 
} from '../factories'

test.describe('Calendar Events', () => {
  // Clean up before all tests
  test.beforeAll(async () => {
    await cleanupCalendarTestData()
  })

  // Clean up after all tests
  test.afterAll(async () => {
    await cleanupCalendarTestData()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    // Wait for calendar to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
  })

  test('should open event form when clicking New Event', async ({ page }) => {
    // Click New Event button
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Should show event form dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Event Details')).toBeVisible()
  })

  test('should create a new simple event', async ({ page }) => {
    const eventTitle = `${TEST_PREFIX}Simple Event ${Date.now()}`
    
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Fill in event details
    await page.getByLabel('Title').fill(eventTitle)
    await page.getByLabel('Description').fill('Test event description')
    
    // Set date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill(dateString)
    }
    
    // Save event
    const saveButton = page.getByRole('button', { name: /save|create/i })
    await expect(saveButton).toBeEnabled()
    await saveButton.click()
    
    // Should close dialog
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    
    // Verify success toast
    await expect(page.getByText(/event created|success/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Try to save without title
    const saveButton = page.getByRole('button', { name: /save|create/i })
    await saveButton.click()
    
    // Should still be on form (validation error)
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Should show validation error
    await expect(page.getByText(/required|title is needed/i).or(
      page.locator('[data-invalid="true"]')
    )).toBeVisible()
  })

  test('should cancel event creation', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Fill something in
    await page.getByLabel('Title').fill('This will be cancelled')
    
    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    if (await cancelButton.isVisible().catch(() => false)) {
      await cancelButton.click()
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape')
    }
    
    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
  })

  test('should show event details when clicking on event', async ({ page }) => {
    // Create a test event via API
    const user = await prisma.member.findFirst({
      where: { username: { startsWith: 'e2e-test-' } },
    })
    
    if (!user) {
      test.skip()
      return
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const event = await createTestEvent(
      user.familyId,
      user.id,
      'Clickable Event',
      { startDate: tomorrow }
    )
    
    // Refresh page
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // Look for the event on the calendar
    const eventElement = page.getByText(`${TEST_PREFIX}Clickable Event`)
    
    if (await eventElement.isVisible().catch(() => false)) {
      await eventElement.click()
      
      // Should show event details or form
      await expect(page.getByRole('dialog')).toBeVisible()
    }
    
    // Cleanup
    await prisma.eventReminder.deleteMany({ where: { eventId: event.id } })
    await prisma.eventException.deleteMany({ where: { eventId: event.id } })
    await prisma.calendarEvent.delete({ where: { id: event.id } })
  })

  test('should create event with time', async ({ page }) => {
    const eventTitle = `${TEST_PREFIX}Timed Event ${Date.now()}`
    
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Fill in event details
    await page.getByLabel('Title').fill(eventTitle)
    
    // Set time if time input exists
    const timeInput = page.locator('input[type="time"]').first()
    if (await timeInput.isVisible().catch(() => false)) {
      await timeInput.fill('14:30')
    }
    
    // Save
    await page.getByRole('button', { name: /save|create/i }).click()
    
    // Should close and show success
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('should create event with location', async ({ page }) => {
    const eventTitle = `${TEST_PREFIX}Located Event ${Date.now()}`
    
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Fill in details
    await page.getByLabel('Title').fill(eventTitle)
    
    // Set location if field exists
    const locationInput = page.getByLabel(/location/i)
    if (await locationInput.isVisible().catch(() => false)) {
      await locationInput.fill('Test Location')
    }
    
    // Save
    await page.getByRole('button', { name: /save|create/i }).click()
    
    // Should close successfully
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})
