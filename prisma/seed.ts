import { PrismaClient, Role } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create test family
  const family = await prisma.family.create({
    data: {
      name: 'Demo Family',
    },
  })
  console.log(`Created family: ${family.name}`)

  // Create parent user (Better-Auth User row) + linked member
  const parentUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'demo-parent@familyhub.local',
      name: 'Demo Parent',
      username: 'demo-parent',
      emailVerified: true,
    },
  })
  const parent = await prisma.member.create({
    data: {
      familyId: family.id,
      userId: parentUser.id,
      role: Role.PARENT,
      username: 'demo-parent',
      displayName: 'Demo Parent',
    },
  })
  console.log(`Created parent: ${parent.displayName}`)

  // Create child user + linked member
  const childUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'demo-child@familyhub.local',
      name: 'Demo Child',
      username: 'demo-child',
      emailVerified: true,
    },
  })
  const child = await prisma.member.create({
    data: {
      familyId: family.id,
      userId: childUser.id,
      role: Role.CHILD,
      username: 'demo-child',
      displayName: 'Demo Child',
    },
  })
  console.log(`Created child: ${child.displayName}`)

  // Create sample chores
  const chores = await prisma.chore.createMany({
    data: [
      {
        familyId: family.id,
        title: 'Make bed',
        description: 'Straighten sheets and arrange pillows',
        points: 5,
        assigneeId: child.id,
        createdBy: parent.id,
      },
      {
        familyId: family.id,
        title: 'Take out trash',
        description: 'Empty kitchen trash and replace bag',
        points: 10,
        recurrenceRule: 'weekly',
        assigneeId: child.id,
        createdBy: parent.id,
      },
      {
        familyId: family.id,
        title: 'Clean room',
        description: 'Pick up toys and vacuum floor',
        points: 15,
        assigneeId: child.id,
        createdBy: parent.id,
      },
    ],
  })
  console.log(`Created ${chores.count} chores`)

  // Create sample todos
  const todos = await prisma.todo.createMany({
    data: [
      {
        familyId: family.id,
        title: 'Buy groceries',
        notes: 'Milk, eggs, bread',
        createdBy: parent.id,
      },
      {
        familyId: family.id,
        title: 'Call grandma',
        assigneeId: child.id,
        createdBy: parent.id,
      },
    ],
  })
  console.log(`Created ${todos.count} todos`)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
