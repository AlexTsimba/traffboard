# User Creation Guide

## Overview

This document explains the proper way to create users in the Traffboard application using Better Auth. It covers both local development and production scenarios.

## ⚠️ Important: Use Better Auth API Methods

**DO NOT** create users by directly inserting records into the database. Always use Better Auth's official API methods to ensure proper:
- Password hashing
- Account linking (credential provider)
- Session management compatibility
- Database consistency

## Creating Admin Users

### Method 1: Using the Admin Creation Script

The recommended way to create admin users is using the provided script:

```bash
npx tsx scripts/create-admin.js
```

### Method 2: Manual Creation (Development)

For development purposes, you can create users programmatically:

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'admin@example.com';
  const password = 'secure-password';
  const name = 'Admin User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`User ${email} already exists`);
      return;
    }

    // Use Better Auth server API to create user properly
    const { auth } = await import('../src/lib/auth.ts');
    
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name
      }
    });

    if (result.user) {
      // Update user to admin role
      await prisma.user.update({
        where: { id: result.user.id },
        data: { 
          role: 'admin',
          emailVerified: true 
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log('👑 Role: admin');
    }

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
```

## Why Better Auth API is Required

Better Auth creates multiple database records for each user:

1. **User record** in the `user` table
2. **Account record** in the `account` table with:
   - `providerId: 'credential'`
   - `accountId: email`
   - Properly hashed password

Direct database insertion will result in `Credential account not found` errors during login.

## Testing User Creation

After creating a user, test the login flow:

1. Start the development server: `npm run dev`
2. Navigate to `/login`
3. Enter the credentials
4. Verify successful authentication and dashboard access

## Common Errors to Avoid

### ❌ Wrong: Direct Database Insertion
```javascript
// DON'T DO THIS
const adminUser = await prisma.user.create({
  data: {
    email,
    name,
    password: hashedPassword, // This won't work with Better Auth
    role: 'admin',
    emailVerified: true,
  }
});
```

### ❌ Wrong: Manual Account Creation
```javascript
// DON'T DO THIS
const adminUser = await prisma.user.create({
  data: {
    email,
    name,
    role: 'admin',
    emailVerified: true,
    accounts: {
      create: {
        accountId: email,
        providerId: 'credential',
        password: hashedPassword, // Better Auth has specific hashing requirements
      }
    }
  }
});
```

### ✅ Correct: Better Auth API
```javascript
// DO THIS
const result = await auth.api.signUpEmail({
  body: {
    email,
    password,
    name
  }
});
```

## Production User Creation

For production environments, use the same script but with environment-specific configurations:

1. Ensure production environment variables are set
2. Use strong passwords
3. Consider using environment variables for sensitive data
4. Run the script with proper database access

## Security Considerations

- Always use strong passwords for admin accounts
- Change default passwords after first login
- Enable two-factor authentication for admin users
- Use environment variables for production credentials
- Never commit credentials to version control

## Troubleshooting

### "Credential account not found" Error
This indicates the user was created directly in the database instead of using Better Auth API. Delete the user and recreate using the proper method.

### "hex string expected, got undefined" Error
This suggests improper password hashing or missing account records. Use Better Auth API methods.

### TypeScript Import Errors
Use `npx tsx` to run scripts that import TypeScript files:
```bash
npx tsx scripts/create-admin.js
```