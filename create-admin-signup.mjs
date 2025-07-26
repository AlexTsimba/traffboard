#!/usr/bin/env node

async function createAdminUser() {
  try {
    console.log('🔍 Creating user via Better Auth signup...')
    
    // First, create the user via signup
    const signupResponse = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@traffboard.com',
        password: 'admin123',
        name: 'Admin User'
      })
    })
    
    console.log('Signup response status:', signupResponse.status)
    
    if (signupResponse.ok) {
      const result = await signupResponse.text()
      console.log('✅ User created via signup!')
      console.log('Response:', result)
      
      // Now we need to update the role to admin manually in database
      console.log('🔧 Updating role to admin...')
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      try {
        await prisma.user.update({
          where: { email: 'admin@traffboard.com' },
          data: { role: 'admin' }
        })
        
        console.log('✅ Admin role assigned!')
        console.log('📧 Email: admin@traffboard.com')
        console.log('🔑 Password: admin123')
      } finally {
        await prisma.$disconnect()
      }
      
    } else {
      const error = await signupResponse.text()
      console.error('❌ Signup failed:', error)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('💡 Make sure the development server is running on http://localhost:3000')
  }
}

createAdminUser()