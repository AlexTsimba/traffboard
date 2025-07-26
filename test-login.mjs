import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  try {
    console.log('🔍 Finding user...')
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      hasPassword: !!user.password
    })
    
    if (user.password) {
      console.log('🔐 Testing password verification...')
      
      const isValid = await bcrypt.compare('admin123', user.password)
      console.log('Password valid:', isValid)
      
      if (!isValid) {
        console.log('🔄 Updating password...')
        const newHash = await bcrypt.hash('admin123', 10) // Use 10 rounds like Better Auth
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash }
        })
        
        console.log('✅ Password updated!')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()