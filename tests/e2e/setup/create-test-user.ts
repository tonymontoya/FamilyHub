/**
 * Create test user via Prisma for E2E tests
 * 
 * Run this before tests to ensure test user exists:
 * npx tsx tests/e2e/setup/create-test-user.ts
 */

import { prisma } from '@/lib/prisma'

const TEST_USER = {
  email: 'test-parent-e2e@example.com',
  password: 'TestPass123!',
  name: 'Test Parent',
  familyName: 'Test Family E2E',
}

async function createTestUser() {
  console.log('Creating test user...')
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
    })
    
    if (existingUser) {
      console.log('Test user already exists')
      return
    }
    
    // Create family first
    const family = await prisma.family.create({
      data: {
        name: TEST_USER.familyName,
      },
    })
    
    // Create user via Better-Auth would require hashing password
    // For now, we'll need to create manually or use API
    console.log('Family created:', family.id)
    
    // Note: Creating auth user requires Better-Auth's hashing
    // This script would need better-auth's createUser function
    console.log('Please create auth user manually or use API registration')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
