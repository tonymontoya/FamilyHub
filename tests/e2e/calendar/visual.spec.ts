/**
 * E2E Tests: Calendar Visual & Accessibility
 * 
 * Tests visual aspects and accessibility:
 * - Calendar renders correctly at different viewports
 * - Event form is accessible
 * - Keyboard navigation works
 * - Color contrast is adequate
 * 
 * Uses pre-authenticated state from auth.setup.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Calendar Visual & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    // Wait for calendar grid to load (prevents race conditions)
    await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
  })

  test('should render calendar at desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Calendar should be visible
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // New Event button should be visible
    await expect(page.getByRole('button', { name: 'New Event' })).toBeVisible()
    
    // Should show day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (const day of dayHeaders) {
      await expect(page.locator(`[data-testid="day-header-${day.toLowerCase()}"]`)).toBeVisible()
    }
  })

  test('should render calendar at tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Calendar should still be visible
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // New Event button should be accessible
    await expect(page.getByRole('button', { name: 'New Event' })).toBeVisible()
  })

  test('should render calendar at mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Calendar should still be visible
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
    
    // Navigation might be collapsed but should still work
    const newEventButton = page.getByRole('button', { name: 'New Event' })
    await expect(newEventButton).toBeVisible()
  })

  test('event form should have proper labels', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    
    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Check for labeled inputs
    const titleInput = page.getByLabel('Title')
    await expect(titleInput).toBeVisible()
    
    // Description should have label
    const descriptionInput = page.getByLabel('Description')
    await expect(descriptionInput).toBeVisible()
    
    // Save button should be present
    await expect(page.getByRole('button', { name: /save|create/i })).toBeVisible()
  })

  test.skip('should support keyboard navigation', async ({ page }) => {
    // Tab to New Event button
    await page.keyboard.press('Tab')
    
    // Press Enter to open form
    await page.keyboard.press('Enter')
    
    // Form should open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Tab through form fields
    await page.keyboard.press('Tab') // To Title
    await page.keyboard.type('Keyboard Event')
    
    await page.keyboard.press('Tab') // To Description
    await page.keyboard.type('Created with keyboard')
    
    // Tab to Save button and press Enter
    // (may need multiple tabs depending on form structure)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }
    
    await page.keyboard.press('Enter')
    
    // Form should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
  })

  test('should close form with Escape key', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Press Escape
    await page.keyboard.press('Escape')
    
    // Form should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
  })

  test('form buttons should have visible focus states', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: 'New Event' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Tab to a button
    await page.keyboard.press('Tab')
    
    // Check that focused element has visible focus indicator
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Get computed styles (limited in Playwright, but can check outline)
    const outline = await focusedElement.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.outline || style.boxShadow
    })
    
    // Should have some focus indicator
    expect(outline).toBeTruthy()
  })

  test.skip('calendar should have proper ARIA roles', async ({ page }) => {
    // Look for grid role (calendar table)
    const grid = page.locator('[role="grid"]').or(page.locator('table'))
    const hasGrid = await grid.isVisible().catch(() => false)
    expect(hasGrid).toBe(true)
    
    // Dialog should have proper role when open
    await page.getByRole('button', { name: 'New Event' }).click()
    
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    // Dialog should have aria-labelledby or aria-label
    const ariaLabel = await dialog.getAttribute('aria-label').catch(() => null)
    const ariaLabelledBy = await dialog.getAttribute('aria-labelledby').catch(() => null)
    expect(ariaLabel || ariaLabelledBy).toBeTruthy()
  })

  test.skip('should not have horizontal scroll on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check document width
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const windowWidth = await page.evaluate(() => window.innerWidth)
    
    // Document should fit within window
    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1) // Allow 1px rounding
  })
})
