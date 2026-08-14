import { test, expect, request as playwrightRequest } from '@playwright/test'

/**
 * Regression: child authentication was completely broken.
 *
 * Before the fix, every resolver looked up the Member via
 * `where: { username: session.user.email }`. A child's Member.username is the
 * short name ("bobby") but their Better-Auth User.email is a synthetic
 * `child-{familyId}-bobby@familyhub.local`, so the lookup never matched and
 * /api/chores/today returned 404 for every signed-in child.
 *
 * This test exercises the REAL end-to-end path: register a parent, create a
 * child, sign in AS the child via the username plugin, then hit a protected
 * API. It must stay green.
 */

const API_URL = 'http://localhost:3000'
const originHeader = { Origin: API_URL }

test.describe('Child login', () => {
  test('child signs in via username and reaches a protected API', async ({ request }) => {
    const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const parentEmail = `e2e-childauth-${unique}@test.com`
    const parentPassword = 'TestPass123!'
    const childUsername = `kid${unique}`.slice(0, 20)
    const childPassword = 'KidPass123!'

    // 1. Register + sign in parent, then set up the family.
    await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: parentEmail, password: parentPassword, name: 'Test Parent' },
      headers: originHeader,
    })

    const parentSignIn = await request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: parentEmail, password: parentPassword },
      headers: originHeader,
    })
    expect(parentSignIn.ok()).toBeTruthy()

    const setupRes = await request.post(`${API_URL}/api/auth/setup-family`, {
      data: { familyName: 'Child Auth Family', parentName: 'Test Parent' },
      headers: originHeader,
    })
    expect(setupRes.ok(), `setup-family failed: ${await setupRes.text()}`).toBeTruthy()

    // 2. Create a child account while authenticated as the parent.
    const createChildRes = await request.post(`${API_URL}/api/children`, {
      data: { username: childUsername, displayName: 'Test Kid', password: childPassword },
      headers: originHeader,
    })
    expect(createChildRes.status()).toBe(201)

    // 3. Isolated context -> sign in AS the child (no parent session leakage).
    const childContext = await playwrightRequest.newContext({ baseURL: API_URL })
    try {
      const childSignIn = await childContext.post(`${API_URL}/api/auth/sign-in/username`, {
        data: { username: childUsername, password: childPassword },
        headers: originHeader,
      })
      expect(childSignIn.ok(), `child sign-in failed: ${await childSignIn.text()}`).toBeTruthy()

      // 4. The protected endpoint that used to 404 for children.
      const choresRes = await childContext.get(`${API_URL}/api/chores/today`)
      expect(choresRes.status(), `chores/today status: ${await choresRes.text()}`).toBe(200)

      const body = await choresRes.json()
      expect(body).toHaveProperty('chores')
      expect(body).toHaveProperty('stats')
    } finally {
      await childContext.dispose()
    }
  })
})
