import { authClient } from '~/lib/auth-client';
import { db } from '~/server/db';

async function globalSetup() {
  console.log('🔧 Running global setup for E2E tests...');
  
  // Try to create the admin user if it doesn't exist
  try {
    await authClient.signUp.email({
      email: 'admin@traffboard.com',
      password: 'TestPass123!',
      name: 'Test Admin'
    });
    console.log('✅ Admin user created for E2E tests');
    
    // Update user role to admin
    await db.user.update({
      where: { email: 'admin@traffboard.com' },
      data: { role: 'admin' }
    });
    console.log('✅ Admin role assigned to test user');
    
  } catch (error) {
    // User might already exist, which is fine
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('✅ Admin user already exists for E2E tests');
      
      // Make sure the existing user has admin role
      try {
        await db.user.update({
          where: { email: 'admin@traffboard.com' },
          data: { role: 'admin' }
        });
        console.log('✅ Admin role ensured for existing test user');
      } catch (roleError) {
        console.log('⚠️  Could not update user role:', roleError);
      }
    } else {
      console.log('⚠️  Could not create admin user:', error);
      // Don't fail the setup - the user might exist with different credentials
    }
  }
}

export default globalSetup;