import { prisma } from './src/lib/prisma'

async function main() {
  const sessions = await prisma.session.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  console.log('Sessions:', sessions.length)
  sessions.forEach(s => {
    console.log('- Session:', s.id.slice(0, 20) + '...', 'User:', s.userId.slice(0, 20) + '...')
  })
  
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  console.log('\nUsers:', users.length)
  users.forEach(u => {
    console.log('- User:', u.email, 'ID:', u.id.slice(0, 20) + '...')
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)
