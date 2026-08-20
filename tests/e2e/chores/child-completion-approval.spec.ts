import { test, expect, request as playwrightRequest } from '@playwright/test'

/**
 * Safety net for the core product flow: chore completion -> parent approval -> points.
 *
 * This flow was never previously exercised end-to-end through the real API; the
 * E2E factories inserted rows directly into the DB, bypassing the routes. Before
 * migrating every chores/completions route onto a new error-handling stack, this
 * test pins the contract so a silent regression in auth, rate-limiting, or the
 * approval transaction is caught immediately.
 *
 * Real path, no DB shortcuts: register parent -> create child -> create+assign
 * chore -> child signs in & completes -> parent approves -> child sees points.
 */

const API_URL = 'http://localhost:3000'
const originHeader = { Origin: API_URL }
const CHORE_POINTS = 25

test.describe('Chore completion and approval', () => {
  test('child completes a chore, parent approves, child sees the points', async ({ request }) => {
    const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    const parentEmail = `e2e-flow-${unique}@test.com`
    const parentPassword = 'TestPass123!'
    const childUsername = `kid${unique}`.slice(0, 20)
    const childPassword = 'KidPass123!'

    // 1. Parent: register, sign in, set up family.
    await request.post(`${API_URL}/api/auth/sign-up/email`, {
      data: { email: parentEmail, password: parentPassword, name: 'Flow Parent' },
      headers: originHeader,
    })
    const parentSignIn = await request.post(`${API_URL}/api/auth/sign-in/email`, {
      data: { email: parentEmail, password: parentPassword },
      headers: originHeader,
    })
    expect(parentSignIn.ok()).toBeTruthy()

    const setupRes = await request.post(`${API_URL}/api/auth/setup-family`, {
      data: { familyName: 'Flow Family', parentName: 'Flow Parent' },
      headers: originHeader,
    })
    expect(setupRes.ok(), `setup-family failed: ${await setupRes.text()}`).toBeTruthy()

    // 2. Parent creates a child account.
    const createChildRes = await request.post(`${API_URL}/api/children`, {
      data: { username: childUsername, displayName: 'Flow Kid', password: childPassword },
      headers: originHeader,
    })
    expect(createChildRes.status()).toBe(201)
    const child = (await createChildRes.json()).data.child
    expect(child.id).toBeTruthy()

    // 3. Parent creates a chore assigned to that child.
    const createChoreRes = await request.post(`${API_URL}/api/chores`, {
      data: {
        title: `Flow Chore ${unique}`,
        points: CHORE_POINTS,
        recurrenceRule: 'RRULE:FREQ=DAILY',
        assigneeId: child.id,
      },
      headers: originHeader,
    })
    expect(createChoreRes.status()).toBe(201)
    const chore = (await createChoreRes.json()).data
    expect(chore.id).toBeTruthy()

    // 4. Child signs in (isolated context -> no parent session leakage).
    const childContext = await playwrightRequest.newContext({ baseURL: API_URL })
    try {
      const childSignIn = await childContext.post(`${API_URL}/api/auth/sign-in/username`, {
        data: { username: childUsername, password: childPassword },
        headers: originHeader,
      })
      expect(childSignIn.ok(), `child sign-in failed: ${await childSignIn.text()}`).toBeTruthy()

      // 5. Child completes the chore (multipart form, no photo).
      const completeRes = await childContext.post(`${API_URL}/api/completions`, {
        multipart: { choreId: chore.id },
        headers: originHeader,
      })
      expect(completeRes.status(), `complete failed: ${await completeRes.text()}`).toBe(201)
      const completion = (await completeRes.json()).data
      expect(completion.status).toBe('PENDING')
      expect(completion.choreId).toBe(chore.id)

      // 6. Parent approves the completion (back on the parent context).
      const approveRes = await request.post(
        `${API_URL}/api/completions/${completion.id}/approve`,
        { data: {}, headers: originHeader }
      )
      expect(approveRes.status(), `approve failed: ${await approveRes.text()}`).toBe(200)
      const approval = (await approveRes.json()).data
      expect(approval.status).toBe('APPROVED')
      expect(approval.pointsAwarded).toBe(CHORE_POINTS)
      expect(approval.child.totalPoints).toBe(CHORE_POINTS)

      // 7. Child reads back: the completion is now APPROVED with awarded points.
      const listRes = await childContext.get(`${API_URL}/api/completions`)
      expect(listRes.status()).toBe(200)
      const listBody = await listRes.json()
      const mine = listBody.data.completions.find((c: { id: string }) => c.id === completion.id)
      expect(mine, 'approved completion not visible to child').toBeTruthy()
      expect(mine.status).toBe('APPROVED')
      expect(mine.pointsAwarded).toBe(CHORE_POINTS)
    } finally {
      await childContext.dispose()
    }
  })
})
