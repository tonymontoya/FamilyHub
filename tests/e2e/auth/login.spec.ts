import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3000'

test.describe('Login Flow', () => {
  test('should login with valid credentials via API', async ({ request }) => {
    const testEmail = `e2e-login-${Date.now()}@test.com`
    const testPassword = 'TestPass123!'
    const originHeader = { Origin: API_URL }
    
    // Step 1: Register
    const signUpRes = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: testEmail, password: testPassword, name: 'Test User' },
      headers: originHeader
    })
    expect(signUpRes.ok()).toBeTruthy()
    
    // Step 2: Sign in
    const signInRes = await request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: testEmail, password: testPassword },
      headers: originHeader
    })
    expect(signInRes.ok()).toBeTruthy()
    
    // Step 3: Verify session exists
    const state = await request.storageState()
    expect(state.cookies.some(c => c.name.includes('session'))).toBeTruthy()
  })

  test('should reject invalid credentials', async ({ request }) => {
    const signInRes = await request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: 'wrong@test.com', password: 'WrongPass123!' }
    })
    expect(signInRes.ok()).toBeFalsy()
  })

  test('should show login page UI', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Sign In' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })
})
