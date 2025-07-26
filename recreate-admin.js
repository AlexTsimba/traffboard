#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function recreateAdmin() {
  try {
    console.log('🔍 Checking for existing admin user...')
    
    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' }
    })
    
    if (existingAdmin) {
      console.log('🗑️  Removing existing admin user...')
      // Delete related records first (due to foreign key constraints)
      await prisma.session.deleteMany({
        where: { userId: existingAdmin.id }
      })
      await prisma.account.deleteMany({
        where: { userId: existingAdmin.id }
      })
      await prisma.twoFactor.deleteMany({
        where: { userId: existingAdmin.id }
      })
      // Delete the user
      await prisma.user.delete({
        where: { id: existingAdmin.id }
      })
    }
    
    console.log('🔐 Hashing password...')
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    console.log('👤 Creating new admin user...')
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@traffboard.com',
        password: hashedPassword,
        emailVerified: true,
        role: 'admin',
        banned: false,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log(`📧 Email: admin@traffboard.com`)
    console.log(`🔑 Password: admin123`)
    console.log(`👤 User ID: ${admin.id}`)
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
recreateAdmin()