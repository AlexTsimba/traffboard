#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recreateAdminProperly() {
  try {
    console.log('🗑️ Removing existing admin user...')
    
    // Remove existing user completely
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' }
    })
    
    if (existingAdmin) {
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
      console.log('✅ Existing user removed')
    }
    
    console.log('🔍 Creating user via Better Auth signup...')
    
    // Create user via Better Auth API
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
      const result = await signupResponse.json()
      console.log('✅ User created via Better Auth!')
      
      // Update role to admin
      console.log('🔧 Updating role to admin...')
      
      await prisma.user.update({
        where: { email: 'admin@traffboard.com' },
        data: { 
          role: 'admin',
          emailVerified: true
        }
      })
      
      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@traffboard.com')
      console.log('🔑 Password: admin123')
      console.log('👤 User ID:', result.user?.id)
      
    } else {
      const error = await signupResponse.text()
      console.error('❌ Signup failed:', error)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('💡 Make sure the development server is running on http://localhost:3000')
  } finally {
    await prisma.$disconnect()
  }
}

recreateAdminProperly()