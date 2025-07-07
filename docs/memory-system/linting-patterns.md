# TraffBoard Linting Patterns & Standards

## 🎯 Critical ESLint Rules

### TypeScript Safety Rules
```json
{
  "@typescript-eslint/no-unsafe-assignment": "error",
  "@typescript-eslint/no-unsafe-member-access": "error", 
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/consistent-type-imports": "error",
  "@typescript-eslint/no-explicit-any": "error"
}
```

### Import Organization Rules
```json
{
  "import/order": ["error", {
    "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
    "newlines-between": "always"
  }]
}
```

### Code Quality Rules  
```json
{
  "unicorn/consistent-function-scoping": "error",
  "prettier/prettier": "error"
}
```

## ✅ Correct Patterns

### Safe Database Queries
```typescript
// ✅ CORRECT: Typed Prisma queries
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true }
});

// ✅ CORRECT: Proper error handling
try {
  const result = await prisma.user.create({ data: userData });
  return { success: true, data: result };
} catch (error) {
  console.error("Database error:", error);
  return { success: false, error: "Operation failed" };
}
```

### Proper Import Organization
```typescript
// ✅ CORRECT: Import order and grouping
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import type { UserResponse } from "./types";
```

### Async/Await Patterns
```typescript
// ✅ CORRECT: Always await promises
await prisma.user.update({
  where: { id: userId },
  data: { lastLoginAt: new Date() }
});

// ✅ CORRECT: Promise with error handling
const result = await apiCall().catch(error => {
  console.error("API Error:", error);
  return null;
});
```

### Function Scoping
```typescript
// ✅ CORRECT: Move to outer scope
const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

const MyComponent = () => {
  const formattedDate = formatDate(new Date());
  return <div>{formattedDate}</div>;
};
```

## ❌ Anti-Patterns to Avoid

### Unsafe Database Operations
```typescript
// ❌ WRONG: Unsafe assignment of Prisma results
const users = await prisma.user.findMany(); // Error: unsafe assignment
const count = users.length; // Error: unsafe member access

// ❌ WRONG: No error handling on database operations
const user = await prisma.user.create({ data }); // Floating promise
```

### Poor Import Patterns
```typescript
// ❌ WRONG: Mixed import styles
import NextRequest from "next/server"; // Should be type import
import { prisma } from "../../lib/prisma"; // Wrong order

// ❌ WRONG: No import grouping
import { auth } from "@/auth";
import React from "react";
import { prisma } from "@/lib/prisma";
```

### Promise Handling Issues
```typescript
// ❌ WRONG: Floating promises
prisma.user.update({ data }); // No await or .catch()

// ❌ WRONG: Function in dependency array
useEffect(() => {
  fetchData();
}, [fetchData]); // Causes infinite loops
```

### Function Scoping Violations
```typescript
// ❌ WRONG: Function defined inside component
const MyComponent = () => {
  const formatDate = (date: Date) => { // Should be outer scope
    return date.toLocaleDateString();
  };
  
  return <div>{formatDate(new Date())}</div>;
};
```

## 🔧 Resolution Strategies

### For Unsafe Assignments
```typescript
// Before: Error-prone
const users = await prisma.user.findMany();

// After: Type-safe
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    role: true
  }
});
```

### For Floating Promises  
```typescript
// Before: Missing await
prisma.user.update({ where: { id }, data });

// After: Proper handling
await prisma.user.update({ where: { id }, data });

// Or with error handling
void prisma.user.update({ where: { id }, data }).catch(console.error);
```

### For Import Issues
```typescript
// Before: Wrong order
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import React from "react";

// After: Correct grouping
import React from "react";

import type { User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
```

## 📋 Quick Fix Commands

```bash
# Auto-fix linting errors
npm run lint -- --fix

# Format code
npm run format

# Type check
npm run typecheck

# Run all quality checks
npm run lint && npm run typecheck && npm run format:check
```

---

*Follow these patterns to maintain production-ready code quality.*