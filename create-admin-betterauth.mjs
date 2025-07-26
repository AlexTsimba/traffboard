import { auth } from './src/lib/auth.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createAdminWithBetterAuth() {
  try {
    console.log('🔍 Checking for existing admin user...')
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' }
    })
    
    if (existingAdmin) {
      console.log('🗑️  Removing existing admin user...')
      // Delete related records first
      await prisma.session.deleteMany({
        where: { userId: existingAdmin.id }
      })
      await prisma.account.deleteMany({
        where: { userId: existingAdmin.id }
      })
      await prisma.twoFactor.deleteMany({
        where: { userId: existingAdmin.id }
      })
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      })
    }
    
    console.log('👤 Creating admin user with Better Auth...')
    
    // Use Better Auth to create the user properly
    const result = await auth.api.signUpEmail({
      body: {
        email: 'admin@traffboard.com',
        password: 'admin123',
        name: 'Admin User'
      }
    })
    
    if (result) {
      console.log('✅ User created via Better Auth!')
      
      // Now update the role to admin using Better Auth admin plugin
      const user = await prisma.user.findUnique({
        where: { email: 'admin@traffboard.com' }
      })
      
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            role: 'admin',
            emailVerified: true
          }
        })
        
        console.log('✅ Admin role assigned!')
        console.log(`📧 Email: admin@traffboard.com`)
        console.log(`🔑 Password: admin123`)
        console.log(`👤 User ID: ${user.id}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminWithBetterAuth()