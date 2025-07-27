import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Recreating admin user properly...');
    
    // Clear existing broken admin
    await prisma.user.deleteMany({
      where: { email: 'admin@traffboard.com' }
    });
    
    // Use Better Auth API to create user properly
    const signUpResponse = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@traffboard.com',
        password: 'TestPass123!',
        name: 'Admin User'
      })
    });
    
    const signUpResult = await signUpResponse.json();
    
    if (signUpResponse.ok && signUpResult.user) {
      console.log('✅ User created via Better Auth:', signUpResult.user.email);
      
      // Update role directly in database (Better Auth admin endpoints may not be available)
      await prisma.user.update({
        where: { id: signUpResult.user.id },
        data: { role: 'admin' }
      });
      
      console.log('✅ Role set to admin');
      console.log('📋 Login credentials:');
      console.log('Email: admin@traffboard.com');
      console.log('Password: TestPass123!');
    } else {
      console.log('❌ Failed to create user:', signUpResult);
    }
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();