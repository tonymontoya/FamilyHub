import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Parent Registration
 * 
 * Tests the complete registration flow:
 * - Form validation
 * - Successful registration
 * - Duplicate email handling
 */

test.describe('Parent Registration', () => {
  // Use a unique email for each test run to avoid conflicts
  const testEmail = `e2e-test-${Date.now()}@example.com`
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('should register new parent and create family', async ({ page }) => {
    // Fill registration form
    await page.getByLabel('Family Name').fill('The Test Family')
    await page.getByLabel('Your Name').fill('Test Parent')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill('SecurePass123!')
    
    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify dashboard shows user content
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    // Submit empty form
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should stay on register page
    await expect(page).toHaveURL('/register')
    
    // Should show validation errors
    await expect(page.getByText(/family name must be at least/i)).toBeVisible()
    await expect(page.getByText(/name must be at least/i)).toBeVisible()
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible()
    await expect(page.getByText(/password must be at least/i)).toBeVisible()
  })

  test('should show validation error for short password', async ({ page }) => {
    await page.getByLabel('Family Name').fill('Test Family')
    await page.getByLabel('Your Name').fill('Test Parent')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('short') // Too short
    
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show password length error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
  })

  test('should prevent registration with existing email', async ({ page }) => {
    // First registration
    await page.getByLabel('Family Name').fill('First Family')
    await page.getByLabel('Your Name').fill('First Parent')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill('SecurePass123!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Wait for first registration to complete
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate back to register
    await page.goto('/register')
    
    // Try to register with same email
    await page.getByLabel('Family Name').fill('Second Family')
    await page.getByLabel('Your Name').fill('Second Parent')
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password').fill('AnotherPass123!')
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Should show error (generic for security)
    await expect(page.getByText(/unable to create account/i)).toBeVisible()
    
    // Should stay on register page
    await expect(page).toHaveURL('/register')
  })

  test('should have link to login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    
    await page.getByRole('link', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/login')
  })
})
