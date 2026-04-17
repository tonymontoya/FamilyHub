import { test, expect } from '@playwright/test'

const viewports = [
  { name: 'mobile-small', width: 375, height: 667 },   // iPhone SE
  { name: 'mobile-large', width: 414, height: 896 },   // iPhone 11 Pro Max
  { name: 'tablet', width: 768, height: 1024 },        // iPad
]

const pages = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/chores', name: 'chores' },
  { path: '/calendar', name: 'calendar' },
  { path: '/family', name: 'family' },
]

for (const viewport of viewports) {
  test.describe(`Mobile Audit: ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
    })

    for (const pageInfo of pages) {
      test(`${pageInfo.name} at ${viewport.name}`, async ({ page }) => {
        await page.goto(pageInfo.path)
        await page.waitForTimeout(2000) // Wait for hydration
        
        // Screenshot for visual review
        await page.screenshot({ 
          path: `test-results/mobile-audit/${viewport.name}-${pageInfo.name}.png`,
          fullPage: true 
        })
        
        // Check for horizontal overflow
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1
        })
        
        console.log(`${pageInfo.name} at ${viewport.name}: overflow=${hasOverflow}`)
        
        // Basic visibility check
        const header = await page.locator('header, [role="banner"]').isVisible().catch(() => false)
        console.log(`  header visible: ${header}`)
      })
    }
  })
}
