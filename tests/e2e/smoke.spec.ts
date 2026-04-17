import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Family Hub/)
    // Use specific selector for the main heading
    await expect(page.getByRole('heading', { name: 'Family Hub', level: 1 })).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    // CardTitle renders as div, look for text specifically in card header
    await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Sign In' })).toBeVisible()
    // Also verify form elements
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    // CardTitle renders as div[data-slot="card-title"]
    await expect(page.locator('div[data-slot="card-title"]').filter({ hasText: 'Create Your Family Hub' })).toBeVisible()
    // Verify form elements
    await expect(page.getByLabel('Family Name')).toBeVisible()
    await expect(page.getByLabel('Your Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })
})
