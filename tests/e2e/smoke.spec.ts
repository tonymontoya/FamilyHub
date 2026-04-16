import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Family Hub/)
    await expect(page.getByText('Family Hub')).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Create Account')).toBeVisible()
  })
})
