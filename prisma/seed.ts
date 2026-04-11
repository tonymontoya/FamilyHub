import { PrismaClient, Role } from '@prisma/client'

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

  // Create parent user (via Better-Auth will be separate)
  // For now, we'll create the member record
  const parent = await prisma.member.create({
    data: {
      familyId: family.id,
      role: Role.PARENT,
      username: 'demo-parent',
      displayName: 'Demo Parent',
    },
  })
  console.log(`Created parent: ${parent.displayName}`)

  // Create child
  const child = await prisma.member.create({
    data: {
      familyId: family.id,
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
