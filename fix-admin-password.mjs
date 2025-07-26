import { PrismaClient } from '@prisma/client'
import { hash } from '@better-auth/crypto'

const prisma = new PrismaClient()

async function fixAdminPassword() {
  try {
    console.log('🔍 Finding admin user...')
    
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' }
    })
    
    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }
    
    console.log('🔐 Updating password with Better Auth hash...')
    
    // Use Better Auth's hash function for proper compatibility
    const hashedPassword = await hash('admin123')
    
    await prisma.user.update({
      where: { id: admin.id },
      data: { 
        password: hashedPassword,
        emailVerified: true
      }
    })
    
    console.log('✅ Admin password updated!')
    console.log(`📧 Email: admin@traffboard.com`)
    console.log(`🔑 Password: admin123`)
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error)
    
    // Fallback to bcrypt if Better Auth hash isn't available
    console.log('🔄 Trying with bcrypt...')
    try {
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      await prisma.user.update({
        where: { email: 'admin@traffboard.com' },
        data: { password: hashedPassword }
      })
      
      console.log('✅ Password updated with bcrypt!')
    } catch (fallbackError) {
      console.error('❌ Fallback failed:', fallbackError)
    }
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminPassword()