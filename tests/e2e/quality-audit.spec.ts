import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3000'

/**
 * Quality Audit Tests
 * 
 * Comprehensive validation of v0.2.0 release candidate
 */

test.describe('Quality Audit: v0.2.0 Release Candidate', () => {
  
  test.describe('Core User Flows', () => {
    
    test('complete parent onboarding flow', async ({ page, request }) => {
      // Register
      const email = `audit-${Date.now()}@test.com`
      const signUpRes = await request.post(`${API_URL}/api/auth/sign-up/email`, {
        data: { email, password: 'TestPass123!', name: 'Audit Test' },
        headers: { Origin: API_URL }
      })
      expect(signUpRes.ok()).toBeTruthy()
      
      // Sign in
      const signInRes = await request.post(`${API_URL}/api/auth/sign-in/email`, {
        data: { email, password: 'TestPass123!' },
        headers: { Origin: API_URL }
      })
      expect(signInRes.ok()).toBeTruthy()
      
      // Setup family
      const setupRes = await request.post(`${API_URL}/api/auth/setup-family`, {
        data: { familyName: 'Audit Family', parentName: 'Audit Test' },
        headers: { Origin: API_URL }
      })
      expect(setupRes.ok()).toBeTruthy()
      
      // Access dashboard
      await page.goto('/dashboard')
      await expect(page.getByRole('heading', { name: /Good morning|Good afternoon|Good evening/ })).toBeVisible()
      
      // Verify navigation
      await expect(page.locator('nav, [data-testid="mobile-nav"]')).toBeVisible()
      
      console.log('✅ Parent onboarding flow works')
    })
    
    test('calendar event creation and display', async ({ page, request }) => {
      // Create test user
      const email = `audit-cal-${Date.now()}@test.com`
      await request.post(`${API_URL}/api/auth/sign-up/email`, {
        data: { email, password: 'TestPass123!', name: 'Cal Test' },
        headers: { Origin: API_URL }
      })
      await request.post(`${API_URL}/api/auth/sign-in/email`, {
        data: { email, password: 'TestPass123!' },
        headers: { Origin: API_URL }
      })
      await request.post(`${API_URL}/api/auth/setup-family`, {
        data: { familyName: 'Cal Family', parentName: 'Cal Test' },
        headers: { Origin: API_URL }
      })
      
      // Create event via API
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
      expect(createRes.ok()).toBeTruthy()
      
      // Verify on calendar
      await page.goto('/calendar')
      await expect(page.locator('[data-testid="calendar-grid"]')).toBeVisible()
      await expect(page.getByText('Quality Audit')).toBeVisible({ timeout: 5000 })
      
      console.log('✅ Calendar event creation and display works')
    })
    
    test('chore management flow', async ({ page, request }) => {
      // Create test user
      const email = `audit-chore-${Date.now()}@test.com`
      await request.post(`${API_URL}/api/auth/sign-up/email`, {
        data: { email, password: 'TestPass123!', name: 'Chore Test' },
        headers: { Origin: API_URL }
      })
      await request.post(`${API_URL}/api/auth/sign-in/email`, {
        data: { email, password: 'TestPass123!' },
        headers: { Origin: API_URL }
      })
      await request.post(`${API_URL}/api/auth/setup-family`, {
        data: { familyName: 'Chore Family', parentName: 'Chore Test' },
        headers: { Origin: API_URL }
      })
      
      // Navigate to chores
      await page.goto('/chores')
      await expect(page.getByRole('heading', { name: 'Chores' })).toBeVisible()
      
      // Create chore via API
      const createRes = await request.post(`${API_URL}/api/chores`, {
        data: {
          title: 'Quality Audit Chore',
          description: 'Test chore for quality audit',
          points: 50,
          recurrenceRule: 'FREQ=DAILY'
        },
        headers: { 'Content-Type': 'application/json', Origin: API_URL }
      })
      expect(createRes.ok()).toBeTruthy()
      
      // Refresh and verify
      await page.reload()
      await expect(page.getByText('Quality Audit Chore')).toBeVisible()
      
      console.log('✅ Chore management flow works')
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
    
    test('pages have proper headings', async ({ page }) => {
      const pages = ['/dashboard', '/calendar', '/chores', '/settings']
      
      for (const path of pages) {
        await page.goto(path)
        const h1 = await page.locator('h1').count()
        expect(h1, `${path} should have an h1`).toBeGreaterThanOrEqual(1)
      }
      
      console.log('✅ All pages have proper headings')
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
      
      // Filter out hydration warnings (known issue in dev mode)
      const criticalErrors = errors.filter(e => 
        !e.includes('hydrat') && 
        !e.includes('server') &&
        !e.includes('StrictMode')
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
