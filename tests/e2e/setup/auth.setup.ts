import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'
import { execSync } from 'child_process'

const parentAuthFile = 'playwright/.auth/parent.json'
const BASE_URL = 'http://localhost:3000'

const TEST_USER = {
  email: `e2e-${Date.now()}@test.com`,
  password: 'TestPass123!',
  parentName: 'E2E Test Parent',
  familyName: 'E2E Family',
}

setup('authenticate as parent', async ({ browser, request }) => {
  console.log('Creating user:', TEST_USER.email)
  
  // Clean up via DB script
  try {
    execSync('npm run db:seed -- --cleanup 2>/dev/null || true', { cwd: process.cwd() })
  } catch {}
  
  // Step 1: Sign up via API
  const signUpRes = await request.post(`${BASE_URL}/api/auth/sign-up/email`, {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.parentName,
    }
  })
  console.log('Sign up status:', signUpRes.status())
  
  // Step 2: Sign in to get session
  const signInRes = await request.post(`${BASE_URL}/api/auth/sign-in/email`, {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    }
  })
  console.log('Sign in status:', signInRes.status())
  
  // Check storage state after sign-in
  const state = await request.storageState()
  console.log('Cookies after sign-in:', state.cookies.length)
  for (const c of state.cookies) {
    console.log(`  - ${c.name} domain=${c.domain}`)
  }
  
  // Check for session cookie
  const sessionCookie = state.cookies.find(c => c.name.includes('session'))
  if (!sessionCookie) {
    throw new Error('No session cookie after sign-in')
  }
  
  // Step 3: Setup family
  const setupRes = await request.post(`${BASE_URL}/api/auth/setup-family`, {
    data: {
      familyName: TEST_USER.familyName,
      parentName: TEST_USER.parentName,
    }
  })
  console.log('Setup family status:', setupRes.status())
  
  if (setupRes.status() !== 200) {
    const body = await setupRes.text()
    throw new Error(`Setup family failed: ${setupRes.status()} - ${body}`)
  }
  
  // Step 4: Ensure cookie domain matches baseURL
  const fixedState = {
    ...state,
    cookies: state.cookies.map(c => ({
      ...c,
      domain: 'localhost'
    }))
  }
  
  // Step 5: Create browser context with fixed cookies and verify
  const context = await browser.newContext({ 
    baseURL: BASE_URL,
    storageState: fixedState 
  })
  const page = await context.newPage()
  
  await page.goto('/dashboard')
  await page.waitForTimeout(1000)
  
  console.log('Dashboard URL:', page.url())
  
  if (!page.url().includes('/dashboard')) {
    await page.screenshot({ path: 'test-results/auth-debug.png' })
    throw new Error('Failed to reach dashboard: ' + page.url())
  }
  
  // Save fixed state to file
  fs.writeFileSync(parentAuthFile, JSON.stringify(fixedState, null, 2))
  
  await context.close()
  console.log('✓ Auth setup complete')
})
