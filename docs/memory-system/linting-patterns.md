# TraffBoard Linting Patterns & Standards (2025)

## 🎯 Critical ESLint Rules (Updated Config)

### TypeScript Safety Rules
```json
{
  "@typescript-eslint/no-unsafe-assignment": "off",
  "@typescript-eslint/no-unsafe-member-access": "off", 
  "@typescript-eslint/no-unsafe-call": "off",
  "@typescript-eslint/no-unsafe-return": "off",
  "@typescript-eslint/no-unsafe-argument": "off",
  "@typescript-eslint/require-await": "error",
  "@typescript-eslint/consistent-type-imports": "error",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/restrict-template-expressions": "warn",
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": "warn"
}
```

### Import Organization Rules
```json
{
  "import/order": ["warn", {
    "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
    "newlines-between": "always",
    "alphabetize": {
      "order": "asc",
      "caseInsensitive": true
    }
  }]
}
```

### Code Quality Rules  
```json
{
  "unicorn/consistent-function-scoping": "recommended",
  "unicorn/no-array-reduce": "off",
  "unicorn/prevent-abbreviations": "off",
  "unicorn/filename-case": "off",
  "unicorn/no-null": "off",
  "sonarjs/prefer-read-only-props": "warn",
  "sonarjs/no-nested-conditional": "warn",
  "security/detect-object-injection": "warn",
  "prettier/prettier": "warn"
}
```

### Next.js Rules
```json
{
  "@next/next/no-img-element": "error",
  "@next/next/no-page-custom-font": "error",
  "react/react-in-jsx-scope": "off",
  "react/prop-types": "off"
}
```

## ✅ Correct Patterns (Production-Ready)

### Database Queries (Pragmatic Approach)
```typescript
// ✅ CORRECT: Prisma queries (unsafe rules disabled for flexibility)
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true }
});

// ✅ CORRECT: Error handling with require-await
const createUser = async (data: UserData) => {
  try {
    const result = await prisma.user.create({ data });
    return { success: true, data: result };
  } catch (error) {
    console.error("Database error:", error);
    return { success: false, error: "Operation failed" };
  }
};
```

### Import Organization (Alphabetized)
```typescript
// ✅ CORRECT: Alphabetized imports with proper grouping
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import type { UserResponse } from "./types";
```

### Async/Await Patterns
```typescript
// ✅ CORRECT: Always await (require-await rule)
const updateUser = async (userId: string, data: UserData) => {
  await prisma.user.update({
    where: { id: userId },
    data: { ...data, lastLoginAt: new Date() }
  });
};

// ✅ CORRECT: Switch exhaustiveness
const handleUserRole = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return "admin-dashboard";
    case "USER":
      return "user-dashboard";
    case "GUEST":
      return "guest-view";
    default:
      // This ensures all cases are handled
      const _exhaustive: never = role;
      throw new Error(`Unhandled role: ${_exhaustive}`);
  }
};
```

### Function Scoping (Recommended)
```typescript
// ✅ CORRECT: Move to outer scope when possible
const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

const MyComponent = () => {
  const formattedDate = formatDate(new Date());
  return <div>{formattedDate}</div>;
};
```

### Unused Imports Handling
```typescript
// ✅ CORRECT: Clean imports (unused-imports plugin)
import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// No unused imports will be automatically removed
```

### Template Expressions (Warn Level)
```typescript
// ✅ ACCEPTABLE: Numbers and booleans allowed
const message = `User count: ${count}`;
const status = `Active: ${isActive}`;

// ⚠️ WARN: But avoid complex expressions
const complex = `Result: ${user?.profile?.settings?.theme || "default"}`;
```

## ❌ Anti-Patterns to Avoid

### Async/Await Violations
```typescript
// ❌ WRONG: Missing await (require-await will catch this)
const createUser = async (data: UserData) => {
  prisma.user.create({ data }); // Missing await!
  return "created";
};
```

### Import Issues
```typescript
// ❌ WRONG: Not alphabetized, wrong grouping
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import React from "react";

// ❌ WRONG: Unused imports
import { unnecessary } from "some-lib"; // Will be auto-removed
```

### Function Scoping Issues
```typescript
// ⚠️ WARN: Function inside component (but not error)
const MyComponent = () => {
  const formatDate = (date: Date) => { // Warning but allowed
    return date.toLocaleDateString();
  };
  
  return <div>{formatDate(new Date())}</div>;
};
```

### Next.js Violations
```typescript
// ❌ ERROR: Using img instead of Image
<img src="/image.jpg" alt="Example" /> // Use next/image instead

// ❌ ERROR: Custom font loading
<link href="https://fonts.googleapis.com/css?family=Inter" rel="stylesheet" />
```

### Switch Statement Issues
```typescript
// ❌ ERROR: Missing exhaustive check
const handleRole = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "USER": 
      return "user";
    // Missing GUEST case - will error
  }
};
```

## 🔧 Resolution Strategies

### For Missing Await
```typescript
// Before: Missing await
const user = prisma.user.create({ data });

// After: Proper async handling
const user = await prisma.user.create({ data });
```

### For Import Order
```typescript
// Before: Wrong order
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import React from "react";

// After: Correct alphabetized order
import React from "react";

import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
```

### For Switch Exhaustiveness
```typescript
// Before: Non-exhaustive
const handleRole = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return "admin";
  }
};

// After: Exhaustive with default
const handleRole = (role: UserRole) => {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "USER":
      return "user";
    case "GUEST":
      return "guest";
    default:
      const _exhaustive: never = role;
      throw new Error(`Unhandled role: ${_exhaustive}`);
  }
};
```

### For Next.js Issues
```typescript
// Before: Plain img tag
<img src="/image.jpg" alt="Example" />

// After: Next.js Image component
import Image from "next/image";
<Image src="/image.jpg" alt="Example" width={400} height={300} />
```

## 📋 Quick Fix Commands

```bash
# Auto-fix linting errors (warnings won't block)
pnpm lint --fix

# Format code (warnings only)
pnpm format

# Type check
pnpm typecheck

# Run all quality checks
pnpm lint && pnpm typecheck && pnpm format:check
```

## 🎯 Key Differences from Strict Config

1. **TypeScript Safety**: Unsafe rules are OFF for flexibility
2. **Import Order**: WARN level (won't block CI)
3. **Prettier**: WARN level (won't block CI)  
4. **Function Scoping**: Recommended but not enforced
5. **Unused Imports**: AUTO-REMOVED by plugin
6. **Switch Exhaustiveness**: ERROR level (enforced)
7. **Async/Await**: ERROR level (enforced)

---

*Follow these patterns for clean, maintainable code that passes CI without token waste on fixes.*
