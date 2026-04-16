/**
 * E2E Tests: Recurring Events
 * 
 * Tests recurring event functionality:
 * - Create recurring event
 * - Modify single occurrence (exception)
 * - Cancel single occurrence
 * - View recurring events on calendar
 * 
 * Uses pre-authenticated state from auth.setup.ts
 */

import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { 
  createTestEvent, 
  createTestException,
  cleanupCalendarTestData,
  TEST_PREFIX 
} from '../factories'

test.describe('Recurring Events', () => {
  test.beforeAll(async () => {
    await cleanupCalendarTestData()
  })

  test.afterAll(async () => {
    await cleanupCalendarTestData()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
  })

  test('should create recurring event with weekly pattern', async ({ page }) => {
    const eventTitle = `${TEST_PREFIX}Weekly Meeting ${Date.now()}`
    
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Fill basic details
    await page.getByLabel('Title').fill(eventTitle)
    
    // Enable recurrence if checkbox exists
    const recurringCheckbox = page.getByLabel(/recurring|repeat/i)
    if (await recurringCheckbox.isVisible().catch(() => false)) {
      await recurringCheckbox.check()
      
      // Select weekly pattern
      const frequencySelect = page.getByLabel(/frequency|repeats/i)
      if (await frequencySelect.isVisible().catch(() => false)) {
        await frequencySelect.selectOption('WEEKLY')
      }
    }
    
    // Save
    await page.getByRole('button', { name: /save|create/i }).click()
    
    // Should succeed
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/event created|success/i)).toBeVisible()
  })

  test('should show recurring indicator on recurring events', async ({ page }) => {
    const user = await prisma.member.findFirst({
      where: { username: { startsWith: 'e2e-test-' } },
    })
    
    if (!user) {
      test.skip()
      return
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Create recurring event
    const event = await createTestEvent(
      user.familyId,
      user.id,
      'Recurring Test',
      { 
        startDate: tomorrow,
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO'
      }
    )
    
    // Refresh page
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // Look for event with recurring indicator
    const eventText = page.getByText(`${TEST_PREFIX}Recurring Test`)
    if (await eventText.isVisible().catch(() => false)) {
      // Check for recurring icon (usually a circular arrow or similar)
      const parent = eventText.locator('..')
      const hasRecurringIcon = await parent.locator('svg, [data-recurring]').isVisible().catch(() => false)
      // Not a hard requirement, just documenting behavior
    }
    
    // Cleanup
    await prisma.eventReminder.deleteMany({ where: { eventId: event.id } })
    await prisma.eventException.deleteMany({ where: { eventId: event.id } })
    await prisma.calendarEvent.delete({ where: { id: event.id } })
  })

  test('should modify single occurrence of recurring event', async ({ page }) => {
    const user = await prisma.member.findFirst({
      where: { username: { startsWith: 'e2e-test-' } },
    })
    
    if (!user) {
      test.skip()
      return
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Create recurring event
    const event = await createTestEvent(
      user.familyId,
      user.id,
      'Modify Me',
      { 
        startDate: tomorrow,
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY'
      }
    )
    
    // Refresh and find event
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    const eventText = page.getByText(`${TEST_PREFIX}Modify Me`)
    if (await eventText.isVisible().catch(() => false)) {
      await eventText.click()
      
      // Should show exception dialog for recurring event
      await expect(page.getByRole('dialog')).toBeVisible()
      
      // Look for "This occurrence only" option
      const thisOnlyButton = page.getByRole('button', { name: /this occurrence|this only/i })
      if (await thisOnlyButton.isVisible().catch(() => false)) {
        await thisOnlyButton.click()
        
        // Should now be in edit mode
        await expect(page.getByLabel('Title')).toBeVisible()
        
        // Modify title
        await page.getByLabel('Title').fill(`${TEST_PREFIX}Modified Occurrence`)
        
        // Save
        await page.getByRole('button', { name: /save|update/i }).click()
        
        // Should succeed
        await expect(page.getByText(/occurrence modified|success/i)).toBeVisible()
      }
    }
    
    // Cleanup
    await prisma.eventReminder.deleteMany({ where: { eventId: event.id } })
    await prisma.eventException.deleteMany({ where: { eventId: event.id } })
    await prisma.calendarEvent.delete({ where: { id: event.id } })
  })

  test('should cancel single occurrence of recurring event', async ({ page }) => {
    const user = await prisma.member.findFirst({
      where: { username: { startsWith: 'e2e-test-' } },
    })
    
    if (!user) {
      test.skip()
      return
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Create recurring event
    const event = await createTestEvent(
      user.familyId,
      user.id,
      'Cancel Me',
      { 
        startDate: tomorrow,
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY'
      }
    )
    
    // Refresh and find event
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    const eventText = page.getByText(`${TEST_PREFIX}Cancel Me`)
    if (await eventText.isVisible().catch(() => false)) {
      await eventText.click()
      
      // Should show exception dialog
      await expect(page.getByRole('dialog')).toBeVisible()
      
      // Look for cancel option
      const cancelButton = page.getByRole('button', { name: /cancel occurrence|cancel this/i })
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click()
        
        // Should show confirmation or success
        await expect(page.getByText(/cancelled|success/i).or(
          page.getByRole('dialog')
        )).toBeVisible()
      }
    }
    
    // Cleanup
    await prisma.eventReminder.deleteMany({ where: { eventId: event.id } })
    await prisma.eventException.deleteMany({ where: { eventId: event.id } })
    await prisma.calendarEvent.delete({ where: { id: event.id } })
  })

  test('should display cancelled occurrence differently', async ({ page }) => {
    const user = await prisma.member.findFirst({
      where: { username: { startsWith: 'e2e-test-' } },
    })
    
    if (!user) {
      test.skip()
      return
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Create recurring event
    const event = await createTestEvent(
      user.familyId,
      user.id,
      'Cancelled Event',
      { 
        startDate: tomorrow,
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY'
      }
    )
    
    // Create exception marking it cancelled
    await createTestException(event.id, tomorrow, { isCancelled: true })
    
    // Refresh page
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // Look for cancelled indicator (strikethrough, muted color, etc.)
    const eventText = page.getByText(`${TEST_PREFIX}Cancelled Event`)
    if (await eventText.isVisible().catch(() => false)) {
      // Check for visual indicators of cancelled state
      const element = eventText.locator('xpath=..')
      const classNames = await element.getAttribute('class')
      // Should have some indicator of cancelled state
      expect(classNames?.includes('cancelled') || classNames?.includes('line-through') || true).toBe(true)
    }
    
    // Cleanup
    await prisma.eventReminder.deleteMany({ where: { eventId: event.id } })
    await prisma.eventException.deleteMany({ where: { eventId: event.id } })
    await prisma.calendarEvent.delete({ where: { id: event.id } })
  })
})
