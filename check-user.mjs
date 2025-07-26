import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' },
      include: {
        accounts: true,
        sessions: true
      }
    })
    
    if (user) {
      console.log('✅ User found:')
      console.log('ID:', user.id)
      console.log('Email:', user.email)
      console.log('Name:', user.name)
      console.log('Role:', user.role)
      console.log('Email Verified:', user.emailVerified)
      console.log('Has Password:', !!user.password)
      console.log('Banned:', user.banned)
      console.log('2FA Enabled:', user.twoFactorEnabled)
      console.log('Accounts:', user.accounts.length)
      console.log('Sessions:', user.sessions.length)
    } else {
      console.log('❌ User not found')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()