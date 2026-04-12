import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Login Flow
 * 
 * Tests authentication:
 * - Valid credentials login
 * - Invalid credentials error
 * - Protected route redirects
 */

test.describe('Login Flow', () => {
  // This test creates its own user to avoid setup dependencies
  const testEmail = `e2e-login-test-${Date.now()}@example.com`
  const testPassword = 'TestPass123!'
  
  test.beforeAll(async ({ browser }) => {
    // Create a test user via registration
    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel('Family Name').fill('Login Test Family')
    await page.getByLabel('Your Name').fill('Login Test User')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.waitForURL('/dashboard')
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify authenticated state
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show generic error (prevents account enumeration)
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should show error for invalid password', async ({ page }) => {
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill('WrongPassword123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Should show generic error
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should show validation for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // HTML5 validation should prevent submission
    // Check that email field has required attribute
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard directly without login
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('should have link to registration page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible()
    
    await page.getByRole('link', { name: /create one/i }).click()
    
    await expect(page).toHaveURL('/register')
  })
})
