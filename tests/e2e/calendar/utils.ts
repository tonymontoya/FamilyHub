/**
 * Calendar Test Utilities
 * 
 * Helper functions for calendar E2E tests
 */

import { Page } from '@playwright/test'

/**
 * Format a date for date input fields (YYYY-MM-DD)
 */
export function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Format a time for time input fields (HH:MM)
 */
export function formatTimeInput(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

/**
 * Get the day cell for a specific date in the calendar
 */
export async function getDayCell(page: Page, date: Date): Promise<ReturnType<Page['locator']> | null> {
  const day = date.getDate()
  
  // Try different selectors
  const selectors = [
    `[data-date="${formatDateInput(date)}"]`,
    `[role="gridcell"]:has-text("${day}")`,
    `td:has-text("${day}")`,
  ]
  
  for (const selector of selectors) {
    const cell = page.locator(selector).first()
    if (await cell.isVisible().catch(() => false)) {
      return cell
    }
  }
  
  return null
}

/**
 * Click on a specific day in the calendar
 */
export async function clickDay(page: Page, date: Date): Promise<boolean> {
  const cell = await getDayCell(page, date)
  if (cell) {
    await cell.click()
    return true
  }
  return false
}

/**
 * Open the new event form
 */
export async function openNewEventForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'New Event' }).click()
}

/**
 * Fill and submit the event form
 */
export async function createEvent(
  page: Page, 
  title: string, 
  options: {
    description?: string
    date?: Date
    time?: string
    location?: string
  } = {}
): Promise<void> {
  // Open form
  await openNewEventForm(page)
  
  // Fill title
  await page.getByLabel('Title').fill(title)
  
  // Fill description if provided
  if (options.description) {
    await page.getByLabel('Description').fill(options.description)
  }
  
  // Set date if provided
  if (options.date) {
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill(formatDateInput(options.date))
    }
  }
  
  // Set time if provided
  if (options.time) {
    const timeInput = page.locator('input[type="time"]').first()
    if (await timeInput.isVisible().catch(() => false)) {
      await timeInput.fill(options.time)
    }
  }
  
  // Set location if provided
  if (options.location) {
    const locationInput = page.getByLabel(/location/i)
    if (await locationInput.isVisible().catch(() => false)) {
      await locationInput.fill(options.location)
    }
  }
  
  // Submit
  await page.getByRole('button', { name: /save|create/i }).click()
}

/**
 * Navigate to a specific month
 */
export async function navigateToMonth(page: Page, targetDate: Date): Promise<void> {
  const targetMonth = targetDate.getMonth()
  const targetYear = targetDate.getFullYear()
  
  // Get current displayed month
  const headerText = await page.locator('h2, h3, [class*="month"]').first().textContent()
  if (!headerText) return
  
  const currentDate = new Date()
  let currentMonth = currentDate.getMonth()
  let currentYear = currentDate.getFullYear()
  
  // Parse header to get current month/year
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  
  for (let i = 0; i < monthNames.length; i++) {
    if (headerText.includes(monthNames[i])) {
      currentMonth = i
      break
    }
  }
  
  const yearMatch = headerText.match(/\d{4}/)
  if (yearMatch) {
    currentYear = parseInt(yearMatch[0])
  }
  
  // Calculate months to navigate
  const monthsDiff = (targetYear - currentYear) * 12 + (targetMonth - currentMonth)
  
  // Navigate
  const prevButton = page.getByRole('button', { name: /previous/i }).or(
    page.locator('button').filter({ has: page.locator('svg[class*="chevron-left"]') })
  )
  const nextButton = page.getByRole('button', { name: /next/i }).or(
    page.locator('button').filter({ has: page.locator('svg[class*="chevron-right"]') })
  )
  
  for (let i = 0; i < Math.abs(monthsDiff); i++) {
    if (monthsDiff > 0) {
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click()
        await page.waitForTimeout(200)
      }
    } else {
      if (await prevButton.isVisible().catch(() => false)) {
        await prevButton.click()
        await page.waitForTimeout(200)
      }
    }
  }
}

/**
 * Wait for toast notification to appear
 */
export async function waitForToast(page: Page, text?: string, timeout = 5000): Promise<boolean> {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    const toast = text 
      ? page.getByText(text)
      : page.locator('[role="status"], .toast, [data-sonner-toast]')
    
    if (await toast.isVisible().catch(() => false)) {
      return true
    }
    
    await page.waitForTimeout(100)
  }
  
  return false
}

/**
 * Check if an event is visible on the calendar
 */
export async function isEventVisible(page: Page, title: string): Promise<boolean> {
  return page.getByText(title).isVisible().catch(() => false)
}

/**
 * Get all visible event titles
 */
export async function getVisibleEvents(page: Page): Promise<string[]> {
  const eventElements = page.locator('[data-event], .event, [class*="event"]').or(
    page.locator('a[href*="/calendar"]')
  )
  
  const count = await eventElements.count()
  const titles: string[] = []
  
  for (let i = 0; i < count; i++) {
    const text = await eventElements.nth(i).textContent()
    if (text) {
      titles.push(text.trim())
    }
  }
  
  return titles
}
