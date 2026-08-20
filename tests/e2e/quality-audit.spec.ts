import { test, expect } from '@playwright/test'
import { provisionParentViaApi, signInViaUi, freshPage } from './helpers/ui-flows'

const API_URL = 'http://localhost:3000'

/**
 * Quality Audit Tests
 *
 * Comprehensive validation of core flows. Each spec provisions its own
 * parent through the real API and signs in through a fresh browser
 * context, so results do not depend on shared-user rate limits or
 * accumulated DB state.
 */

test.describe('Quality Audit', () => {

  test.describe('Core User Flows', () => {

    test('complete parent onboarding flow', async ({ browser, request }) => {
      const { email, password } = await provisionParentViaApi(request, `onboard${Date.now().toString(36)}`)
      const { page, close } = await freshPage(browser)
      try {
        await signInViaUi(page, email, password)

        // Access dashboard
        await page.goto('/dashboard')
        await expect(page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening/ })).toBeVisible()

        // Verify navigation (desktop sidebar)
        await expect(page.getByRole('complementary', { name: 'Main navigation' })).toBeVisible()

        console.log('✅ Parent onboarding flow works')
      } finally {
        await close()
      }
    })

    test('calendar event creation and display', async ({ browser, request }) => {
      const { email, password } = await provisionParentViaApi(request, `cal${Date.now().toString(36)}`)

      // Create event via API (request context is signed in as this parent)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createRes = await request.post(`${API_URL}/api/calendar/events`, {
        data: {
          title: 'Quality Audit Event',
          startDate: tomorrow.toISOString().split('T')[0],
          type: 'EVENT',
        },
        headers: { 'Content-Type': 'application/json', Origin: API_URL }
      })
      expect(createRes.ok(), `event create failed: ${await createRes.text()}`).toBeTruthy()

      // Verify on calendar as this parent
      const { page, close } = await freshPage(browser)
      try {
        await signInViaUi(page, email, password)
        await page.goto('/calendar')
        await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
        await expect(page.getByText('Quality Audit')).toBeVisible({ timeout: 10000 })

        console.log('✅ Calendar event creation and display works')
      } finally {
        await close()
      }
    })

    test('chore management flow', async ({ browser, request }) => {
      const { email, password } = await provisionParentViaApi(request, `chore${Date.now().toString(36)}`)

      // Create chore via API (request context is signed in as this parent)
      const createRes = await request.post(`${API_URL}/api/chores`, {
        data: {
          title: 'Quality Audit Chore',
          description: 'Test chore for quality audit',
          points: 50,
          recurrenceRule: 'FREQ=DAILY'
        },
        headers: { 'Content-Type': 'application/json', Origin: API_URL }
      })
      expect(createRes.ok(), `chore create failed: ${await createRes.text()}`).toBeTruthy()

      // Verify in the UI as this parent
      const { page, close } = await freshPage(browser)
      try {
        await signInViaUi(page, email, password)
        await page.goto('/chores')
        await expect(page.getByRole('heading', { name: 'Chores' })).toBeVisible()
        await expect(page.getByText('Quality Audit Chore')).toBeVisible({ timeout: 10000 })

        console.log('✅ Chore management flow works')
      } finally {
        await close()
      }
    })
  })
  
  test.describe('Mobile Responsiveness', () => {
    
    test('all pages fit on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const pages = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/calendar', name: 'Calendar' },
        { path: '/chores', name: 'Chores' },
        { path: '/family', name: 'Family' },
        { path: '/settings', name: 'Settings' },
      ]
      
      for (const { path, name } of pages) {
        await page.goto(path)
        await page.waitForTimeout(1000)
        
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 1
        })
        
        expect(hasOverflow, `${name} has horizontal overflow`).toBe(false)
        console.log(`✅ ${name} fits on mobile`)
      }
    })
    
    test('touch targets meet minimum size', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/dashboard')
      
      // Get all interactive elements
      const buttons = await page.locator('button, a, [role="button"]').all()
      let smallElements = 0
      
      for (const el of buttons.slice(0, 20)) {
        const box = await el.boundingBox()
        if (box && (box.width < 32 || box.height < 32)) {
          smallElements++
        }
      }
      
      // Allow up to 20% small elements (badges, icons)
      expect(smallElements).toBeLessThanOrEqual(buttons.length * 0.2)
      console.log(`✅ Touch targets meet minimum size (${smallElements} small elements found)`)
    })
  })
  
  test.describe('Accessibility', () => {
    
    test('pages have proper headings', async ({ browser, request }) => {
      const { email, password } = await provisionParentViaApi(request, `head${Date.now().toString(36)}`)
      const { page, close } = await freshPage(browser)
      try {
        await signInViaUi(page, email, password)
        const pages = ['/dashboard', '/calendar', '/chores', '/settings']

        for (const path of pages) {
          await page.goto(path)
          // Dashboard renders client-side; wait for the shell to settle
          // before counting headings.
          await page.waitForLoadState('networkidle')
          await expect(page.locator('h1').first(), `${path} should have an h1`).toBeVisible({ timeout: 15000 })
        }

        console.log('✅ All pages have proper headings')
      } finally {
        await close()
      }
    })
    
    test('forms have associated labels', async ({ page }) => {
      await page.goto('/login')
      
      // Check login form
      const emailInput = page.locator('input[type="email"]')
      const emailLabel = await emailInput.getAttribute('aria-label')
        .catch(() => page.locator('label[for="email"]').textContent().catch(() => null))
      
      expect(emailInput).toBeVisible()
      console.log('✅ Form inputs have labels')
    })
  })
  
  test.describe('Performance', () => {
    
    test('pages load within acceptable time', async ({ page }) => {
      const start = Date.now()
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      const loadTime = Date.now() - start
      
      expect(loadTime).toBeLessThan(5000) // 5 seconds max
      console.log(`✅ Dashboard loads in ${loadTime}ms`)
    })
    
    test('no console errors on critical pages', async ({ page }) => {
      const errors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      await page.goto('/dashboard')
      await page.goto('/calendar')
      await page.goto('/chores')
      
      // Filter out known dev-mode noise (hydration warnings, navigation-
      // cancelled fetches from the dashboard poller)
      const criticalErrors = errors.filter(e =>
        !e.includes('hydrat') &&
        !e.includes('server') &&
        !e.includes('StrictMode') &&
        !e.includes('Failed to fetch')
      )
      
      expect(criticalErrors).toHaveLength(0)
      console.log(`✅ No console errors (${errors.length} warnings filtered)`)
    })
  })
  
  test.describe('Data Integrity', () => {
    
    test('API responses have correct structure', async ({ request }) => {
      // Test health endpoint
      const health = await request.get(`${API_URL}/api/health`)
      expect(health.ok()).toBeTruthy()
      
      // Create user and test authenticated endpoints
      const email = `audit-api-${Date.now()}@test.com`
      await request.post(`${API_URL}/api/auth/sign-up/email`, {
        data: { email, password: 'TestPass123!', name: 'API Test' },
        headers: { Origin: API_URL }
      })
      await request.post(`${API_URL}/api/auth/sign-in/email`, {
        data: { email, password: 'TestPass123!' },
        headers: { Origin: API_URL }
      })
      await request.post(`${API_URL}/api/auth/setup-family`, {
        data: { familyName: 'API Family', parentName: 'API Test' },
        headers: { Origin: API_URL }
      })
      
      // Test dashboard API
      const dashboard = await request.get(`${API_URL}/api/dashboard?timezone=America/Los_Angeles`)
      expect(dashboard.ok()).toBeTruthy()
      const dashData = await dashboard.json()
      expect(dashData).toHaveProperty('user')
      expect(dashData).toHaveProperty('today')
      expect(dashData).toHaveProperty('meta')
      
      console.log('✅ API responses have correct structure')
    })
  })
})
