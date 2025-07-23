import { auth } from './src/lib/auth.js';

async function createUser() {
  try {
    // Use Better Auth's signUp method to create user properly
    const result = await auth.api.signUpEmail({
      body: {
        email: 'simba292@gmail.com',
        password: 'password',
        name: 'Simba Admin'
      }
    });
    
    console.log('✅ User created via Better Auth:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUser();