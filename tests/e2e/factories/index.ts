/**
 * Test Data Factories
 * 
 * Utilities for creating test data in the database.
 * Used in E2E tests to set up known state.
 */

import { prisma } from '@/lib/prisma'

// Test data prefixes to identify and clean up test data
export const TEST_PREFIX = 'e2e-test-'

/**
 * Clean up all test data from database
 * Call in beforeAll or afterAll to ensure clean state
 */
export async function cleanupTestData() {
  // Delete in order respecting foreign keys
  await prisma.pointTransaction.deleteMany({
    where: { member: { username: { startsWith: TEST_PREFIX } } },
  })
  
  await prisma.completion.deleteMany({
    where: { member: { username: { startsWith: TEST_PREFIX } } },
  })
  
  await prisma.todo.deleteMany({
    where: { family: { name: { startsWith: TEST_PREFIX } } },
  })
  
  await prisma.chore.deleteMany({
    where: { family: { name: { startsWith: TEST_PREFIX } } },
  })
  
  await prisma.member.deleteMany({
    where: { username: { startsWith: TEST_PREFIX } },
  })
  
  await prisma.family.deleteMany({
    where: { name: { startsWith: TEST_PREFIX } },
  })
}

/**
 * Create a test family
 */
export async function createTestFamily(name: string) {
  return prisma.family.create({
    data: {
      name: `${TEST_PREFIX}${name}`,
    },
  })
}

/**
 * Create a test parent member
 */
export async function createTestParent(
  familyId: string,
  username: string,
  displayName: string
) {
  return prisma.member.create({
    data: {
      familyId,
      role: 'PARENT',
      username: `${TEST_PREFIX}${username}`,
      displayName,
    },
  })
}

/**
 * Create a test child member
 */
export async function createTestChild(
  familyId: string,
  username: string,
  displayName: string
) {
  return prisma.member.create({
    data: {
      familyId,
      role: 'CHILD',
      username: `${TEST_PREFIX}${username}`,
      displayName,
    },
  })
}

/**
 * Create a test chore
 */
export async function createTestChore(
  familyId: string,
  title: string,
  options: {
    description?: string
    points?: number
    assigneeId?: string
    createdBy: string
  }
) {
  return prisma.chore.create({
    data: {
      familyId,
      title: `${TEST_PREFIX}${title}`,
      description: options.description,
      points: options.points ?? 10,
      assigneeId: options.assigneeId,
      createdBy: options.createdBy,
    },
  })
}

/**
 * Create a test todo
 */
export async function createTestTodo(
  familyId: string,
  title: string,
  options: {
    notes?: string
    assigneeId?: string
    dueDate?: Date
    createdBy: string
  }
) {
  return prisma.todo.create({
    data: {
      familyId,
      title: `${TEST_PREFIX}${title}`,
      notes: options.notes,
      assigneeId: options.assigneeId,
      dueDate: options.dueDate,
      createdBy: options.createdBy,
    },
  })
}

// ===== Calendar Factories =====

/**
 * Create a test calendar event
 */
export async function createTestEvent(
  familyId: string,
  createdById: string,
  title: string,
  options: {
    description?: string
    startDate?: Date
    startTime?: Date
    endDate?: Date
    endTime?: Date
    timezone?: string
    isRecurring?: boolean
    recurrenceRule?: string
    location?: string
    type?: 'EVENT' | 'APPOINTMENT' | 'ACTIVITY' | 'BIRTHDAY' | 'HOLIDAY' | 'REMINDER'
    color?: string
    isFamilyWide?: boolean
    assigneeIds?: string[]
  } = {}
) {
  const now = new Date()
  const startDate = options.startDate ?? now
  
  return prisma.calendarEvent.create({
    data: {
      familyId,
      createdById,
      title: `${TEST_PREFIX}${title}`,
      description: options.description,
      startDate,
      startTime: options.startTime,
      endDate: options.endDate,
      endTime: options.endTime,
      timezone: options.timezone ?? 'UTC',
      isRecurring: options.isRecurring ?? false,
      recurrenceRule: options.recurrenceRule,
      location: options.location,
      type: options.type ?? 'EVENT',
      color: options.color,
      isFamilyWide: options.isFamilyWide ?? true,
      assigneeIds: options.assigneeIds ?? [],
    },
  })
}

/**
 * Create a test event reminder
 */
export async function createTestReminder(
  eventId: string,
  options: {
    minutesBefore?: number
    type?: 'BROWSER' | 'EMAIL' | 'PUSH'
    isSent?: boolean
    isAcknowledged?: boolean
  } = {}
) {
  const now = new Date()
  
  return prisma.eventReminder.create({
    data: {
      eventId,
      minutesBefore: options.minutesBefore ?? 15,
      type: options.type ?? 'BROWSER',
      isSent: options.isSent ?? false,
      isAcknowledged: options.isAcknowledged ?? false,
      ...(options.isSent ? { sentAt: now } : {}),
      ...(options.isAcknowledged ? { acknowledgedAt: now } : {}),
    },
  })
}

/**
 * Create a test event exception
 */
export async function createTestException(
  eventId: string,
  originalDate: Date,
  options: {
    title?: string
    description?: string
    startTime?: Date
    endTime?: Date
    location?: string
    isCancelled?: boolean
  } = {}
) {
  return prisma.eventException.create({
    data: {
      eventId,
      originalDate,
      title: options.title,
      description: options.description,
      startTime: options.startTime,
      endTime: options.endTime,
      location: options.location,
      isCancelled: options.isCancelled ?? false,
    },
  })
}

/**
 * Clean up calendar test data
 */
export async function cleanupCalendarTestData() {
  // Delete reminders first (foreign key constraint)
  await prisma.eventReminder.deleteMany({
    where: { event: { title: { startsWith: TEST_PREFIX } } },
  })
  
  // Delete exceptions
  await prisma.eventException.deleteMany({
    where: { event: { title: { startsWith: TEST_PREFIX } } },
  })
  
  // Delete events
  await prisma.calendarEvent.deleteMany({
    where: { title: { startsWith: TEST_PREFIX } },
  })
}
