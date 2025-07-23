# OAuth Account Creation Prevention - Implementation Plan

## Objective
Prevent Better Auth from automatically creating new user accounts when unregistered users attempt to sign in via Google OAuth. Show clear error message directing them to contact administrator.

## Better Auth Hooks Documentation Analysis

### Hook System Overview
- **Before Hooks**: Run before endpoint execution, can modify requests or prevent execution
- **After Hooks**: Run after endpoint execution, can modify responses
- **Context Object**: Contains `path`, `body`, `headers`, `query`, `context`
- **Error Handling**: Use `APIError` with status codes and messages

### Relevant Endpoint Paths
Based on Better Auth documentation, OAuth sign-in endpoints follow patterns like:
- `/sign-in/social/google` - Social sign-in endpoint
- `/sign-up/social/google` - Social sign-up endpoint (if separate)

## Implementation Strategy

### Phase 1: Better Auth Hooks Configuration

#### 1.1 Hook Matcher Strategy
```typescript
// Target OAuth sign-in endpoints specifically
matcher: (ctx) => {
  return ctx.path?.includes("/sign-in/social") || 
         ctx.path?.includes("/sign-up/social");
}
```

#### 1.2 User Existence Check Logic
```typescript
handler: async (ctx) => {
  // Extract email from context (could be in body or user object)
  const email = ctx.body?.email || ctx.user?.email;
  
  if (!email) {
    throw new APIError("BAD_REQUEST", {
      message: "Email is required for authentication"
    });
  }
  
  // Check if user exists in database
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!existingUser) {
    throw new APIError("FORBIDDEN", {
      message: "No account found with this email. Contact your administrator for access."
    });
  }
  
  // If user exists, allow the OAuth flow to continue
}
```

### Phase 2: Implementation in auth.ts

#### 2.1 Add Required Imports
```typescript
import { APIError } from "better-auth";
import { PrismaClient } from "@prisma/client";
```

#### 2.2 Add Hooks Configuration
```typescript
export const auth = betterAuth({
  // ... existing configuration
  hooks: {
    before: [
      {
        matcher: (ctx) => {
          // Target social sign-in endpoints
          return ctx.path?.includes("/sign-in/social") || 
                 ctx.path?.includes("/sign-up/social");
        },
        handler: async (ctx) => {
          // Extract email from OAuth context
          const email = ctx.body?.email || ctx.user?.email;
          
          if (!email) {
            throw new APIError("BAD_REQUEST", {
              message: "Email is required for authentication"
            });
          }
          
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email }
          });
          
          if (!existingUser) {
            throw new APIError("FORBIDDEN", {
              message: "No account found with this email. Contact your administrator for access."
            });
          }
          
          // Allow OAuth flow to continue for existing users
        }
      }
    ]
  }
});
```

### Phase 3: Error Handling in Frontend

#### 3.1 Update OAuth Error Handling in Login Page
```typescript
// In src/app/(auth)/login/page.tsx
const handleGoogleSignIn = async () => {
  try {
    setIsSubmitting(true);
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard'
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('No account found')) {
        authNotifications.oauth.noAccount();
      } else {
        authNotifications.oauth.error(err.message);
      }
    } else {
      authNotifications.oauth.error('Failed to sign in with Google');
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

#### 3.2 Add New Toast Notification
```typescript
// In src/lib/toast-utils.ts
export const authNotifications = {
  // ... existing notifications
  oauth: {
    noAccount: () => toast.error("Account not found", {
      description: "No account exists with this Google email. Contact your administrator for access.",
      duration: 8000 // Longer duration for important message
    }),
    // ... other oauth notifications
  }
}
```

## Validation Against Better Auth Documentation

### ✅ Correct Patterns Used
1. **Hook Type**: Using `before` hook to prevent execution ✅
2. **Matcher Function**: Properly targeting OAuth endpoints ✅  
3. **Error Handling**: Using `APIError` with proper status codes ✅
4. **Context Usage**: Accessing `ctx.path`, `ctx.body`, `ctx.user` ✅
5. **Database Access**: Using existing Prisma instance ✅

### ✅ Security Considerations
1. **Email Validation**: Ensures email exists before checking database ✅
2. **Proper Error Messages**: Clear messaging for users ✅
3. **Allow Existing Users**: Doesn't break current OAuth users ✅
4. **Prevent Account Creation**: Blocks new account creation via OAuth ✅

## Testing Strategy

### Test Cases
1. **Existing User with OAuth**: Should sign in successfully
2. **Existing User without OAuth**: Should sign in successfully (first time linking)
3. **Non-existent Email**: Should receive clear error message
4. **Invalid Email Format**: Should handle gracefully
5. **Email/Password Login**: Should remain unaffected

### User Scenarios
1. **Admin-created user tries OAuth first time**: Gets error, must link in settings first
2. **Admin-created user with linked OAuth**: Signs in normally
3. **Random Google user**: Gets clear "contact administrator" message
4. **Existing user continues using email/password**: Unaffected

## Implementation Steps

### Step 1: Update Better Auth Configuration (30 minutes)
1. Add hooks configuration to `auth.ts`
2. Import required types (`APIError`)
3. Test configuration loads without errors

### Step 2: Update Frontend Error Handling (30 minutes)
1. Update login page OAuth handler
2. Add new toast notification
3. Test error message display

### Step 3: Testing (1 hour)
1. Test with existing OAuth users
2. Test with new Google emails
3. Test with admin-created users
4. Verify email/password login unaffected

### Step 4: Validation (30 minutes)
1. Check error messages are user-friendly
2. Verify security - no accidental account creation
3. Confirm existing functionality preserved

## Expected Outcomes

### Before Implementation
- Random Google users can create accounts automatically
- No control over who gets access
- Silent account creation

### After Implementation  
- Only existing users can use OAuth (after linking in settings)
- Clear error message for unauthorized users
- No accidental account creation
- Maintains dual authentication for authorized users

## Rollback Strategy

### If Issues Arise
1. **Quick Rollback**: Comment out hooks configuration
2. **Partial Rollback**: Modify hook matcher to be more specific
3. **Error Handling**: Add try-catch around hook logic

### Monitoring Points
- OAuth sign-in success rates for existing users  
- Error message frequency and user feedback
- Any breaking of existing authentication flows

## Timeline
- **Implementation**: 2 hours
- **Testing**: 1 hour  
- **Documentation**: 30 minutes
- **Total**: 3.5 hours

This approach follows Better Auth's official patterns and provides the exact behavior needed for an internal project.