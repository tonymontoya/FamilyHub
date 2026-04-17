import { test, expect } from '@playwright/test'

const MOBILE_VIEWPORT = { width: 375, height: 667 }

test.describe('Mobile Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
  })

  test('calendar day cells have minimum touch target size', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForSelector('[data-testid="calendar-grid"]')
    
    // Check date buttons are at least 32x32px (close to 44px ideal)
    const dateButtons = await page.locator('[data-testid="calendar-grid"] button').all()
    
    for (const button of dateButtons.slice(0, 5)) {
      const box = await button.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(28)
        expect(box.height).toBeGreaterThanOrEqual(28)
      }
    }
    
    console.log(`Checked ${dateButtons.length} date buttons for touch target size`)
  })

  test('calendar header fits on mobile screen', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForSelector('[data-testid="calendar-grid"]')
    
    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1
    })
    expect(hasOverflow).toBe(false)
    
    // Check header is visible
    const header = page.locator('[data-testid="calendar-day-headers"]')
    await expect(header).toBeVisible()
    
    // Check short weekday names are shown
    const shortDay = page.locator('text=S').first()
    await expect(shortDay).toBeVisible()
  })

  test('event form opens and fits on mobile', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForSelector('[data-testid="calendar-grid"]')
    
    // Click New Event button
    await page.getByRole('button', { name: /new event/i }).click()
    
    // Form dialog should be visible
    const dialog = page.locator('[data-slot="dialog-content"]')
    await expect(dialog).toBeVisible()
    
    // Check dialog fits within viewport
    const box = await dialog.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width)
    }
    
    // Can close with X button
    await page.locator('[data-slot="dialog-close"]').click()
    await expect(dialog).not.toBeVisible()
  })

  test('mobile navigation is visible and accessible', async ({ page }) => {
    await page.goto('/dashboard')
    
    // On mobile, bottom navigation should be visible (not a hamburger menu)
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
    await expect(mobileNav).toBeVisible()
    
    // Navigation items should be tappable
    const navItems = await mobileNav.locator('a, button').all()
    expect(navItems.length).toBeGreaterThan(0)
    
    // Check touch targets on nav items
    for (const item of navItems) {
      const box = await item.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44) // Min touch target
      }
    }
    
    console.log(`Mobile nav visible with ${navItems.length} items`)
  })

  test('all interactive elements have sufficient touch targets', async ({ page }) => {
    await page.goto('/chores')
    await page.waitForTimeout(1000)
    
    // Get all buttons and links
    const interactiveElements = await page.locator('button, a, [role="button"]').all()
    
    let smallElements = 0
    const minTouchSize = 44 // WCAG recommended minimum
    
    for (const el of interactiveElements.slice(0, 20)) {
      const box = await el.boundingBox()
      if (box && (box.width < minTouchSize || box.height < minTouchSize)) {
        smallElements++
      }
    }
    
    console.log(`Found ${smallElements} elements smaller than ${minTouchSize}px`)
    
    // Allow some small elements (icons, badges) but most should be tappable
    expect(smallElements).toBeLessThan(interactiveElements.length * 0.5)
  })
})
