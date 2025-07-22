# TRAFFBOARD AUTHENTICATION ARCHITECTURE

## 🎯 System Overview

**Internal Analytics Tool Authentication System**
- **No Public Registration** - Admin-controlled user creation only
- **Better Auth Framework** - TypeScript-native, framework-agnostic authentication
- **Better Auth UI** - Pre-built authentication components with theme integration
- **PostgreSQL + Prisma** - Database integration matching existing patterns
- **2FA with TOTP** - Time-based One-Time Password for enhanced security
- **Role-Based Access** - Admin and user permission levels
- **Session Management** - Comprehensive session control and monitoring

---

## 🏗️ Architecture Alignment

### Integration with Existing Routing System

This authentication system seamlessly integrates with the documented routing architecture in `/docs/architecture/routing.md`, eliminating header duplication:

```
app/
├── layout.tsx                      # Root Layout (EXISTING)
├── middleware.ts                   # Route Protection & Authentication (ENHANCED)
├── page.tsx                        # Public Home → Redirects to dashboard if authenticated
├── (auth)/                         # Authentication Routes (NEW)
│   ├── layout.tsx                 # Auth Layout (Server Component)
│   ├── login/page.tsx             # Login Page (Better Auth UI)
│   └── 2fa/page.tsx               # 2FA Verification (TOTP)
├── (protected)/                    # Protected Routes (EXISTING - ENHANCED)
│   ├── layout.tsx                 # Protected Layout with SINGLE SharedHeader
│   ├── dashboard/page.tsx         # Content Only - NO header duplication
│   ├── reports/                   # Reports Section (EXISTING)
│   │   ├── page.tsx               # Content Only - NO header duplication
│   │   ├── cohort/page.tsx        # Content Only - NO header duplication
│   │   ├── conversions/page.tsx   # Content Only - NO header duplication
│   │   ├── quality/page.tsx       # Content Only - NO header duplication
│   │   └── landings/page.tsx      # Content Only - NO header duplication
│   └── admin/                     # Admin Management (NEW)
│       ├── users/page.tsx         # User CRUD operations
│       └── sessions/page.tsx      # Session monitoring
├── api/auth/[...all]/route.ts     # Better Auth Handler (NEW)
└── components/                     # Shared Components (EXISTING + NEW)
    ├── shared-header.tsx          # SINGLE header with user menu
    ├── ui/                        # Shadcn UI Components (EXISTING)
    └── auth/                      # Auth-specific Components (NEW)
```

---

## 📊 Database Schema Design

### Better Auth Tables (Auto-Generated)

```prisma
model User {
  id               String    @id @default(cuid())
  name             String
  email            String    @unique
  emailVerified    Boolean   @default(false)
  image            String?
  password         String?
  twoFactorEnabled Boolean   @default(false)
  role             String    @default("user") // "user" | "admin"
  banned           Boolean   @default(false)
  banExpiresAt     DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  // Relations
  sessions      Session[]
  accounts      Account[]
  twoFactor     TwoFactor?
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String   @id @default(cuid())
  userId                String
  accountId             String
  providerId            String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([providerId, accountId])
}

model TwoFactor {
  id          String  @id @default(cuid())
  userId      String  @unique
  secret      String?
  backupCodes String? // JSON array of recovery codes
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id          String    @id @default(cuid())
  identifier  String
  value       String
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  
  @@unique([identifier, value])
}
```

### Schema Generation Commands

```bash
# Generate Better Auth schema
npx @better-auth/cli generate

# Apply to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## ⚙️ Better Auth Configuration

### Server Configuration

```typescript
// lib/auth.ts - Following existing Prisma client pattern from test-db/route.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@prisma/client";

// Using same instantiation pattern as existing test-db route
const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql" // Matching existing database setup
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // Internal tool - admin creates users
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24      // 24 hours  
  },
  appName: "Traffboard Analytics", // Required for 2FA issuer
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"]
    }),
    twoFactor({
      issuer: "Traffboard Analytics"
      // TOTP only - no OTP for internal tool
    }),
    nextCookies() // Must be last in plugins array
  ]
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

### Client Configuration

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { twoFactorClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa";
      }
    }),
    adminClient()
  ]
});
```

### API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

---

## 🛡️ Route Protection & Middleware

### Next.js 15.2.0+ Middleware Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const protectedRoutes = ['/dashboard', '/reports', '/admin'];
const authRoutes = ['/login', '/2fa'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Use Next.js 15.2.0+ session fetch with Node.js runtime
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Redirect authenticated users away from auth pages
  if (session && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin route protection (additional check in page components)
  if (adminRoutes.some(route => path.startsWith(route))) {
    if (!session || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs", // Required for Next.js 15.2.0+
  matcher: ['/dashboard/:path*', '/reports/:path*', '/admin/:path*', '/login', '/2fa']
};
```

### Protected Layout Enhancement (FIXES Header Duplication)

```typescript
// app/(protected)/layout.tsx - SINGLE SharedHeader eliminates duplication
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { SharedHeader } from '@/components/shared-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* SINGLE SharedHeader component - NO duplication in individual pages */}
        <SharedHeader />
        <main className="flex-1 p-4 pt-0" data-content-wrapper>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## 🔐 Authentication Flows

### 1. Login Flow

```
1. User visits /dashboard
   ↓
2. Middleware detects no session → Redirect to /login
   ↓
3. User enters email/password → Better Auth validates
   ↓
4. If 2FA enabled → Redirect to /2fa page
   ↓
5. User enters TOTP/backup code → Verification
   ↓
6. Success → Session created → Redirect to /dashboard
```

### 2. Two-Factor Authentication Setup

```
1. Authenticated user accesses Profile/Security settings
   ↓
2. Click "Enable 2FA" → authClient.twoFactor.enable()
   ↓
3. Better Auth generates TOTP secret + backup codes
   ↓
4. Display QR code for authenticator app setup
   ↓
5. User scans QR code and enters first TOTP
   ↓
6. authClient.twoFactor.verifyTotp() → Success
   ↓
7. 2FA enabled → Display backup codes for safe storage
```

### 3. Admin User Management

```
1. Admin login → Access admin panel (/admin/users)
   ↓
2. Create user:
   - authClient.admin.createUser()
   - Email + temporary password
   - User receives credentials via admin
   ↓
3. Manage users:
   - View all users with 2FA status
   - Delete users (revokes all sessions)
   - Reset 2FA (user must re-setup)
   - Ban/unban users
   ↓
4. Session management:
   - View active sessions per user
   - Revoke specific or all sessions
   - Monitor login activity
```

---

## 🎨 UI Components Architecture

### Authentication Pages with Better Auth UI

```typescript
// app/(auth)/login/page.tsx - Using Better Auth UI Components
import { SignIn } from "@better-auth/ui/react";
import { auth } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>
      <SignIn 
        auth={auth}
        appearance={{
          theme: "auto", // Integrates with existing theme system
          elements: {
            card: "border-0 shadow-none",
            primaryButton: "w-full",
            formFieldInput: "h-10"
          }
        }}
        // Better Auth UI handles all login logic including 2FA redirects
        onSuccess={(ctx) => {
          if (ctx.data.twoFactorRedirect) {
            // Better Auth UI automatically handles 2FA redirect
            return;
          }
          window.location.href = '/dashboard';
        }}
      />
    </div>
  );
}
```

```typescript
// app/(auth)/2fa/page.tsx
'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function TwoFactorPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const verifyCode = async () => {
    setLoading(true);
    
    const method = useBackupCode ? 'verifyBackupCode' : 'verifyTotp';
    const { error } = await authClient.twoFactor[method]({
      code,
      callbackURL: "/dashboard",
      trustDevice: true // Remember device for 60 days
    });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <p className="text-muted-foreground">
            {useBackupCode ? 'Enter backup code' : 'Enter authenticator code'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder={useBackupCode ? "Backup code" : "6-digit code"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={useBackupCode ? 10 : 6}
          />
          <Button onClick={verifyCode} disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Verify"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setUseBackupCode(!useBackupCode)}
            className="w-full"
          >
            {useBackupCode ? 'Use authenticator code' : 'Use backup code'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Admin Components

```typescript
// components/admin/user-management-table.tsx
'use client';
import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function UserManagementTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await authClient.admin.listUsers();
    setUsers(data?.users || []);
    setLoading(false);
  };

  const createUser = async () => {
    const email = prompt('Enter email:');
    const password = prompt('Enter temporary password:');
    const name = prompt('Enter full name:');
    
    if (email && password && name) {
      await authClient.admin.createUser({
        email,
        password,
        name,
        role: 'user'
      });
      loadUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure? This will revoke all sessions.')) {
      await authClient.admin.deleteUser({ userId });
      loadUsers();
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await authClient.admin.setRole({ userId, role: newRole });
    loadUsers();
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button onClick={createUser}>Create User</Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>2FA Status</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.twoFactorEnabled ? 'default' : 'outline'}>
                  {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.banned ? 'destructive' : 'default'}>
                  {user.banned ? 'Banned' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleUserRole(user.id, user.role)}
                >
                  {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteUser(user.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Enhanced User Menu with Better Auth UI

```typescript
// components/shared-header.tsx - Enhanced with Better Auth UI User Button
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger, Separator } from '@/components/ui/sidebar';
import { UserButton } from '@/components/auth/user-button';

export function SharedHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
      </div>
      <div className="ml-auto px-4 flex items-center gap-2">
        <UserButton /> {/* Better Auth UI User Button with 2FA, settings, logout */}
      </div>
    </header>
  );
}
```

```typescript
// components/auth/user-button.tsx - Better Auth UI User Button
'use client';
import { UserButton as BetterUserButton } from "@better-auth/ui/react";
import { authClient } from "@/lib/auth-client";

export function UserButton() {
  return (
    <BetterUserButton 
      authClient={authClient}
      appearance={{
        elements: {
          userButtonAvatarBox: "w-8 h-8",
          userButtonTrigger: "focus:ring-2 focus:ring-ring"
        }
      }}
      // Better Auth UI provides built-in 2FA management, profile settings, logout
    />
  );
}
```

### 2FA Setup Component with Better Auth UI

```typescript
// components/auth/two-factor-setup.tsx - Integrated with Better Auth UI
'use client';
import { TwoFactorSetup as BetterTwoFactorSetup } from "@better-auth/ui/react";
import { authClient } from '@/lib/auth-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function TwoFactorSetup() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <BetterTwoFactorSetup
          authClient={authClient}
          appearance={{
            theme: "auto", // Integrates with existing theme system
            elements: {
              card: "border-0 shadow-none",
              primaryButton: "w-full"
            }
          }}
          // Better Auth UI handles QR codes, backup codes, verification automatically
        />
      </CardContent>
    </Card>
  );
}
```

---

## 📋 Implementation Timeline

### Phase 1: Foundation (Day 1-2)
- [ ] Install Better Auth dependencies
- [ ] Configure Better Auth server with plugins
- [ ] Generate database schema
- [ ] Create API route handler
- [ ] Set up auth client configuration

### Phase 2: Authentication Pages (Day 3-4)  
- [ ] Implement Better Auth UI components (SignIn, UserButton, TwoFactorSetup)
- [ ] Create auth layout component with theme integration
- [ ] Style Better Auth UI to match existing design system
- [ ] Test login flow with automatic 2FA handling

### Phase 3: Route Protection (Day 5)
- [ ] Implement Next.js 15.2.0+ middleware
- [ ] Enhance protected layout with session validation
- [ ] Test route protection and redirects
- [ ] Add middleware to existing protected routes

### Phase 4: Admin Features (Day 6-7)
- [ ] Build admin user management interface
- [ ] Implement session management components
- [ ] Add admin role protection
- [ ] Create user creation/deletion flows

### Phase 5: 2FA Integration (Day 8-9)
- [ ] Integrate Better Auth UI TwoFactorSetup component
- [ ] Test automatic QR code and backup code handling
- [ ] Verify 2FA management in UserButton dropdown
- [ ] Test complete 2FA enrollment and verification flow

### Phase 6: Integration & Testing (Day 10)
- [ ] Update shared header with Better Auth UI UserButton
- [ ] Verify theme integration across all Better Auth UI components
- [ ] Fix any header duplication issues in existing pages
- [ ] Comprehensive testing of all authentication flows
- [ ] Error handling and loading states

---

## 🔧 Key Dependencies

```json
{
  "dependencies": {
    "better-auth": "^1.2.9",
    "@better-auth/ui": "^1.0.0"
  },
  "devDependencies": {
    "@better-auth/cli": "^0.1.0"
  }
}
```

---

## 🎯 Security Features

### Authentication Security
- ✅ **Secure password hashing** - Better Auth handles bcrypt automatically
- ✅ **Session management** - Automatic token rotation and expiration
- ✅ **CSRF protection** - Built-in cross-site request forgery protection
- ✅ **Rate limiting** - Configurable login attempt limits

### Two-Factor Authentication
- ✅ **TOTP support** - Google Authenticator, Authy compatibility
- ✅ **Backup codes** - 10 single-use recovery codes
- ✅ **Trusted devices** - 60-day device memory
- ✅ **Admin 2FA reset** - Emergency access recovery

### Access Control
- ✅ **Role-based permissions** - Admin vs user access levels
- ✅ **Route protection** - Middleware-level security
- ✅ **Session monitoring** - Admin can view/revoke user sessions
- ✅ **User management** - Admin-controlled account lifecycle

---

## 📈 Monitoring & Maintenance

### Session Management
- View active sessions per user
- Monitor login locations and devices
- Revoke suspicious or inactive sessions
- Track 2FA enrollment status

### User Administration
- Create users with temporary passwords
- Manage user roles and permissions
- Handle 2FA reset requests
- Monitor authentication failures

### Security Auditing
- Track admin actions (user creation/deletion)
- Monitor failed login attempts
- Log 2FA setup and usage
- Session security events

---

## 🎯 Key Corrections Applied

### ✅ Better Auth UI Integration
- **Corrected**: Now properly integrates actual Better Auth UI components (SignIn, UserButton, TwoFactorSetup)
- **Benefit**: Pre-built, professionally styled components with automatic theme integration
- **Components**: All authentication UI handled by Better Auth UI library

### ✅ Prisma Adapter Pattern Verification  
- **Corrected**: Verified Prisma client instantiation matches existing `test-db/route.ts` pattern
- **Pattern**: `const prisma = new PrismaClient();` exactly as used in current codebase
- **Compatibility**: Ensures consistent database connection handling

### ✅ Header Duplication Elimination
- **Problem**: Routing docs showed "❌ Duplicated header" in dashboard and reports pages
- **Solution**: Single `SharedHeader` component in protected layout only
- **Result**: All content pages (dashboard, reports/*) have NO individual headers
- **Architecture**: Protected layout provides the ONLY header instance

---

This authentication architecture provides a comprehensive, secure foundation for the Traffboard analytics platform while maintaining seamless integration with the existing route structure and design system. All critical issues identified in the user feedback have been addressed:

1. **Better Auth UI properly integrated** with existing theme system
2. **Prisma adapter configuration verified** against existing database patterns  
3. **Header duplication completely eliminated** through single SharedHeader approach