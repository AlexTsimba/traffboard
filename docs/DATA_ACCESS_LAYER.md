# TraffBoard Data Access Layer (DAL) Documentation

## Overview

The Data Access Layer (DAL) is a security-first approach to database operations in TraffBoard. All database queries must go through the DAL to ensure proper authentication, authorization, and audit logging.

## Security Architecture

### Why DAL?

1. **CVE-2025-29927 Compliance**: Addresses Next.js middleware authentication vulnerabilities
2. **Centralized Security**: All database operations have built-in authentication checks
3. **Audit Trail**: All data access is logged for security monitoring
4. **Type Safety**: Uses DTOs (Data Transfer Objects) to control data exposure
5. **Authorization**: Role-based access control at the data layer

### Multi-Layered Protection

```
┌─────────────────────────────────────────────────┐
│ Layer 1: UI Components (role-based rendering)   │
├─────────────────────────────────────────────────┤
│ Layer 2: Server Actions (input validation)      │
├─────────────────────────────────────────────────┤
│ Layer 3: Data Access Layer (authentication)     │
├─────────────────────────────────────────────────┤
│ Layer 4: Database (data integrity)              │
└─────────────────────────────────────────────────┘
```

## DAL Structure

### Core Files

```
src/lib/data/
├── auth.ts          # Authentication utilities
├── users.ts         # User management operations
├── sessions.ts      # Session management
└── [future modules] # Additional data modules
```

### Authentication Core (`auth.ts`)

```typescript
// Basic authentication requirement
export async function requireAuth(): Promise<AuthenticatedUser>;

// Admin-only operations
export async function requireAdmin(): Promise<AuthenticatedUser>;

// Permission checking
export async function hasPermission(permission: string): Promise<boolean>;

// Security logging
export function auditLog(action: string, userId?: string, details?: Record<string, unknown>): void;
```

## How to Use the DAL

### 1. Always Use Authentication Functions

**✅ CORRECT:**

```typescript
export async function createUser(userData: CreateUserData): Promise<SafeUser> {
  const currentUser = await requireAdmin(); // ✅ Authentication check

  // ... rest of function
  auditLog("users.create", currentUser.id, { targetEmail: user.email });
  return user;
}
```

**❌ WRONG:**

```typescript
export async function createUser(userData: CreateUserData) {
  // ❌ No authentication check
  const user = await prisma.user.create({ data: userData });
  return user;
}
```

### 2. Use Safe Data Types (DTOs)

**✅ CORRECT:**

```typescript
export interface SafeUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  // ✅ No sensitive fields like passwordHash
}
```

**❌ WRONG:**

```typescript
// ❌ Exposing full database object
return await prisma.user.findMany(); // Contains passwordHash, etc.
```

### 3. Server Actions Pattern

**✅ CORRECT:**

```typescript
"use server";

import { createUser } from "@/lib/data/users";

export async function createUserAction(formData: FormData) {
  try {
    const validatedData = createUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
    });

    const user = await createUser(validatedData); // ✅ Uses DAL
    revalidatePath("/administration");

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**❌ WRONG:**

```typescript
// ❌ Direct database access in API route
export async function POST(request: Request) {
  const data = await request.json();
  const user = await prisma.user.create({ data }); // ❌ No DAL
  return NextResponse.json(user);
}
```

## Current DAL Coverage

### ✅ Fully Implemented

- **Authentication Operations** (`auth.ts`)
  - User authentication and authorization
  - Role checking and permissions
  - Security audit logging

- **User Management** (`users.ts`)
  - User CRUD operations
  - Profile management
  - Password changes
  - Admin user creation

- **Session Management** (`sessions.ts`)
  - Session tracking and metadata
  - Session revocation
  - Activity monitoring

### ⚠️ Partially Implemented

- **2FA Operations**: API routes exist but no Server Actions
- **Admin User Management**: Some routes still use direct Prisma

### ❌ Not Yet Implemented

- **CSV Processing**: Direct Prisma queries in API routes
- **Analytics Data**: Players, traffic reports, uploads
- **System Operations**: Health checks, demo data

## Migration Checklist

When migrating an API route to DAL:

1. **✅ Create DAL Function**

   ```typescript
   export async function getAnalyticsData(): Promise<AnalyticsData[]> {
     const user = await requireAuth();
     // Implementation with audit logging
   }
   ```

2. **✅ Create Server Action**

   ```typescript
   "use server";
   export async function getAnalyticsAction() {
     return await getAnalyticsData();
   }
   ```

3. **✅ Update Component**

   ```typescript
   // Replace fetch() with Server Action
   const data = await getAnalyticsAction();
   ```

4. **✅ Remove API Route**

   ```bash
   rm src/app/api/analytics/route.ts
   ```

5. **✅ Test Functionality**
   - Verify authentication works
   - Check audit logging
   - Test error handling

## Security Best Practices

### 1. Never Skip Authentication

```typescript
// ✅ Always check authentication first
export async function sensitiveOperation() {
  const user = await requireAuth(); // or requireAdmin()
  // ... rest of function
}
```

### 2. Always Audit Important Operations

```typescript
// ✅ Log security-relevant events
auditLog("users.delete", currentUser.id, { targetUserId: userId });
```

### 3. Use Proper Error Handling

```typescript
// ✅ Don't expose internal errors
try {
  // ... operation
} catch (error) {
  auditLog("operation.failed", userId, { error: error.message });
  throw new Error("Operation failed"); // Generic message
}
```

### 4. Validate All Inputs

```typescript
// ✅ Use Zod for validation
const validatedData = createUserSchema.parse(rawData);
```

## Testing DAL Functions

### Unit Testing Pattern

```typescript
import { requireAuth } from "@/lib/data/auth";
import { createUser } from "@/lib/data/users";

// Mock authentication for testing
jest.mock("@/lib/data/auth");
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

test("createUser requires authentication", async () => {
  mockRequireAuth.mockRejectedValue(new Error("Authentication required"));

  await expect(createUser(userData)).rejects.toThrow("Authentication required");
});
```

## Common Patterns

### 1. Admin-Only Operations

```typescript
export async function adminOnlyFunction(): Promise<Result> {
  const admin = await requireAdmin(); // Throws if not admin
  auditLog("admin.operation", admin.id);
  // ... implementation
}
```

### 2. Self-or-Admin Access

```typescript
export async function getUserProfile(userId: string): Promise<SafeUser> {
  const currentUser = await requireAuth();

  // Users can access their own profile, admins can access any
  if (currentUser.role !== "superuser" && currentUser.id !== userId) {
    throw new Error("Permission denied");
  }

  // ... implementation
}
```

### 3. Batch Operations with Audit

```typescript
export async function bulkUpdateUsers(updates: UserUpdate[]): Promise<void> {
  const admin = await requireAdmin();

  for (const update of updates) {
    // ... individual update
    auditLog("users.bulk_update", admin.id, { targetUserId: update.id });
  }
}
```

## Future Enhancements

1. **Permission System**: Granular permissions beyond role-based access
2. **Rate Limiting**: Built into DAL functions for API protection
3. **Caching Layer**: Intelligent caching with security considerations
4. **Analytics Module**: DAL functions for traffic reports and player data
5. **Backup Operations**: Secure data export with audit trails

## Troubleshooting

### Common Issues

**"Authentication required" errors:**

- Ensure Server Actions/API routes call DAL functions
- Check that session is properly established
- Verify JWT token includes user.id

**"Admin access required" errors:**

- Confirm user role is "superuser"
- Check role assignment in database
- Verify requireAdmin() vs requireAuth() usage

**Audit logs not appearing:**

- Check console output (current implementation)
- Future: Check audit log database table

### Debug Commands

```bash
# Check user roles in database
npm run prisma:studio

# Verify authentication in browser
# Check Network tab for auth-related requests
```

## Conclusion

The DAL provides enterprise-grade security for TraffBoard by ensuring:

1. **Zero Trust**: Every database operation requires authentication
2. **Audit Trail**: All security events are logged
3. **Type Safety**: Only safe data is exposed to clients
4. **Role-Based Access**: Proper authorization at the data layer
5. **Modern Architecture**: Server Actions + DAL replaces vulnerable patterns

Always use DAL functions for database operations. Never access Prisma directly outside of `/src/lib/data/`.
