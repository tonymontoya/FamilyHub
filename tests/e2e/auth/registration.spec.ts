import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3000'
const generateEmail = () => `e2e-reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@test.com`

test.describe('Parent Registration', () => {
  test('should allow registration via API and access dashboard', async ({ page, request }) => {
    const testEmail = generateEmail()
    const testPassword = 'SecurePass123!'
    
    // Step 1: Register via API
    const signUpRes = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: testEmail, password: testPassword, name: 'Test Parent' }
    })
    expect(signUpRes.ok(), `Sign up failed: ${await signUpRes.text()}`).toBeTruthy()
    
    // Step 2: Sign in
    const signInRes = await request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: testEmail, password: testPassword }
    })
    expect(signInRes.ok()).toBeTruthy()
    
    // Step 3: Setup family
    const setupRes = await request.post(`${API_URL}/api/auth/setup-family`, {
      data: { familyName: 'Test Family', parentName: 'Test Parent' }
    })
    expect(setupRes.ok()).toBeTruthy()
    
    // Step 4: Verify dashboard access
    const state = await request.storageState()
    expect(state.cookies.length).toBeGreaterThan(0)
    
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible()
  })

  test('should prevent duplicate email registration', async ({ request }) => {
    const testEmail = generateEmail()
    
    // First registration
    const firstRes = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: testEmail, password: 'Pass123!', name: 'First User' }
    })
    expect(firstRes.ok()).toBeTruthy()
    
    // Second should fail
    const secondRes = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: testEmail, password: 'Pass123!', name: 'Second User' }
    })
    expect(secondRes.ok()).toBeFalsy()
  })

  test('should show registration page UI', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('text=Create Your Family Hub')).toBeVisible()
    await expect(page.getByLabel('Family Name')).toBeVisible()
    await expect(page.getByLabel('Your Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })
})
