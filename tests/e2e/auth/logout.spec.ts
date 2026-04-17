import { test, expect } from '@playwright/test'

const API_URL = 'http://localhost:3000'

test.describe('Logout Flow', () => {
  test('should logout and clear session', async ({ request }) => {
    // Create and login a test user
    const testEmail = `e2e-logout-${Date.now()}@test.com`
    
    await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: testEmail, password: 'TestPass123!', name: 'Test User' }
    })
    
    await request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: testEmail, password: 'TestPass123!' }
    })
    
    await request.post(`${API_URL}/api/auth/setup-family`, {
      data: { familyName: 'Test Family', parentName: 'Test User' }
    })
    
    // Verify session exists
    const stateBefore = await request.storageState()
    expect(stateBefore.cookies.some(c => c.name.includes('session'))).toBeTruthy()
    
    // Logout
    const logoutRes = await request.post(`${API_URL}/api/auth/sign-out`)
    expect(logoutRes.ok()).toBeTruthy()
    
    // Verify session cleared
    const stateAfter = await request.storageState()
    expect(stateAfter.cookies.some(c => c.name.includes('session'))).toBeFalsy()
  })
})
