/**
 * Seed test user for E2E tests
 * Run this before tests: npx tsx tests/e2e/setup/seed-test-user.ts
 */

import { prisma } from '@/lib/prisma'
import { hash } from '@better-auth/utils/hash'

const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPass123!',
  name: 'E2E Test User',
  familyName: 'E2E Test Family',
}

async function seedTestUser() {
  console.log('Seeding test user...')
  
  try {
    // Clean up existing
    const existing = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    })
    
    if (existing) {
      console.log('Test user exists, cleaning up...')
      await prisma.session.deleteMany({ where: { userId: existing.id } })
      await prisma.account.deleteMany({ where: { userId: existing.id } })
      const member = await prisma.member.findFirst({ where: { username: TEST_USER.email } })
      if (member) {
        await prisma.member.deleteMany({ where: { familyId: member.familyId } })
        await prisma.family.delete({ where: { id: member.familyId } }).catch(() => {})
      }
      await prisma.user.delete({ where: { id: existing.id } })
    }
    
    // Create family
    const family = await prisma.family.create({
      data: { name: TEST_USER.familyName }
    })
    
    // Create user with Better-Auth compatible hash
    const hashedPassword = await hash(TEST_USER.password)
    
    const user = await prisma.user.create({
      data: {
        email: TEST_USER.email,
        name: TEST_USER.name,
        emailVerified: true,
      }
    })
    
    // Create account with password
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: 'credential',
        accountId: user.id,
        password: hashedPassword,
      }
    })
    
    // Create member
    await prisma.member.create({
      data: {
        familyId: family.id,
        username: TEST_USER.email,
        displayName: TEST_USER.name,
        role: 'PARENT',
      }
    })
    
    console.log('✓ Test user created:', TEST_USER.email)
    console.log('Password:', TEST_USER.password)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTestUser()
