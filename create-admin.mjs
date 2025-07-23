import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUser() {
  try {
    // Delete existing users first
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('🗑️ Deleted existing users');

    // Create user via Better Auth API call
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'simba292@gmail.com',
        password: 'password',
        name: 'Simba Admin'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ User created via Better Auth API:', result.user.email);
    } else {
      console.error('❌ Failed to create user:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();