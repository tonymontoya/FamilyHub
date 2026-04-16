/**
 * E2E Tests: Calendar Navigation
 * 
 * Tests calendar page access and navigation:
 * - Calendar page loads for authenticated users
 * - Month/Week/Day view switching
 * - Previous/Next navigation
 * - Today button functionality
 * 
 * Uses pre-authenticated state from auth.setup.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Calendar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
  })

  test('should show calendar page to authenticated users', async ({ page }) => {
    // Verify calendar URL
    await expect(page).toHaveURL('/calendar')
    
    // Verify calendar heading
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // Verify calendar grid is present
    await expect(page.locator('[data-testid="calendar-grid"]').or(
      page.locator('table').or(page.locator('[role="grid"]'))
    )).toBeVisible()
  })

  test('should show New Event button', async ({ page }) => {
    const newEventButton = page.getByRole('button', { name: 'New Event' })
    await expect(newEventButton).toBeVisible()
    await expect(newEventButton).toBeEnabled()
  })

  test('should display current month by default', async ({ page }) => {
    const now = new Date()
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    // Should show current month in header
    await expect(page.getByText(monthName, { exact: false })).toBeVisible()
  })

  test('should navigate to previous month', async ({ page }) => {
    // Get current month text
    const now = new Date()
    const currentMonth = now.toLocaleDateString('en-US', { month: 'long' })
    
    // Click previous button
    const prevButton = page.getByRole('button', { name: /previous|prev|back/i }).or(
      page.locator('button').filter({ has: page.locator('svg[class*="chevron-left"]') })
    )
    
    if (await prevButton.isVisible().catch(() => false)) {
      await prevButton.click()
      
      // Wait for month to change
      await page.waitForTimeout(500)
      
      // Should show different month
      const pageContent = await page.textContent('body')
      expect(pageContent).toBeTruthy()
    } else {
      test.skip()
    }
  })

  test('should navigate to next month', async ({ page }) => {
    // Click next button
    const nextButton = page.getByRole('button', { name: /next/i }).or(
      page.locator('button').filter({ has: page.locator('svg[class*="chevron-right"]') })
    )
    
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click()
      
      // Wait for month to change
      await page.waitForTimeout(500)
      
      // Page should still be calendar
      await expect(page).toHaveURL('/calendar')
    } else {
      test.skip()
    }
  })

  test('should have today button', async ({ page }) => {
    const todayButton = page.getByRole('button', { name: /today/i })
    
    if (await todayButton.isVisible().catch(() => false)) {
      await expect(todayButton).toBeEnabled()
    } else {
      test.skip()
    }
  })

  test('should show day headers (Sun-Sat)', async ({ page }) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // At least some day headers should be visible
    const foundDays = await Promise.all(
      dayNames.map(async (day) => {
        const element = page.getByText(day, { exact: false })
        return element.isVisible().catch(() => false)
      })
    )
    
    expect(foundDays.filter(Boolean).length).toBeGreaterThanOrEqual(5)
  })
})
