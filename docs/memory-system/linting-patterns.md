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

### Security & Object Injection Rules

```json
{
  "security/detect-object-injection": "warn",
  "sonarjs/prefer-read-only-props": "warn",
  "sonarjs/no-nested-conditional": "warn",
  "sonarjs/no-unused-vars": "warn",
  "sonarjs/updated-const-var": "error"
}
```

### Import Organization Rules

```json
{
  "import/order": [
    "warn",
    {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
      "alphabetize": {
        "order": "asc",
        "caseInsensitive": true
      }
    }
  ]
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
  "unicorn/prefer-native-coercion-functions": "error",
  "unicorn/no-for-loop": "error",
  "unicorn/prefer-for-of": "error",
  "unicorn/prefer-spread": "error",
  "unicorn/no-typeof-undefined": "error",
  "unicorn/no-useless-undefined": "error",
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

## 🚨 Chart Component Security Patterns (CRITICAL)

### Object Injection Prevention

The `security/detect-object-injection` rule flags dynamic property access. Here are the safe patterns:

#### ❌ DANGEROUS: Dynamic Property Access
```typescript
// ❌ Will trigger security warnings
const value = data[dynamicKey];
const config = configs[metricName];
const breakpointValue = cohort.breakpointValues[breakpoint];

// ❌ Object methods that trigger warnings
Object.entries(data).forEach(([key, value]) => {
  result[key] = value; // Security warning
});
```

#### ✅ SAFE: Map-Based Access
```typescript
// ✅ CORRECT: Use Map for safe property access
export function getBreakpointValue(
  breakpointValues: Record<number, number | null>,
  breakpoint: number,
): number | null {
  if (typeof breakpoint !== "number" || !Number.isInteger(breakpoint) || breakpoint < 0) {
    return null;
  }

  // Use 'in' operator for safe checking
  if (breakpoint in breakpointValues) {
    return breakpointValues[breakpoint];
  }

  return null;
}

// ✅ CORRECT: Validate keys before access
export function getMetricConfig<T extends Record<string, unknown>>(
  configs: T,
  metric: string,
): T[keyof T] | undefined {
  if (typeof metric !== "string") {
    return undefined;
  }

  // Safe property access with validation
  if (metric in configs) {
    return configs[metric as keyof T];
  }

  return undefined;
}

// ✅ CORRECT: Safe property setting with spread operator
export function setChartDataProperty(
  data: Record<string, unknown>,
  property: string,
  value: unknown,
): Record<string, unknown> {
  if (typeof property !== "string" || !validateChartConfigKey(property)) {
    return data;
  }

  // Use spread operator for immutable update
  return {
    ...data,
    [property]: value,
  };
}
```

#### ✅ SAFE: Key Validation Utilities
```typescript
// ✅ CORRECT: Always validate keys
export function validateChartConfigKey(key: string): boolean {
  if (typeof key !== "string") {
    return false;
  }
  // Allow alphanumeric, underscore, and dash characters
  return /^[a-zA-Z0-9_-]+$/.test(key);
}

// ✅ CORRECT: Safe iteration without Object.entries
export function getValidBreakpointValues(
  cohorts: { breakpointValues: Record<number, number | null> }[],
  breakpoint: number,
): number[] {
  const values: number[] = [];

  for (const cohort of cohorts) {
    const value = getBreakpointValue(cohort.breakpointValues, breakpoint);
    if (typeof value === "number") {
      values.push(value);
    }
  }

  return values;
}
```

### Read-Only Props Pattern

#### ❌ WRONG: Mutable Props
```typescript
interface ComponentProps {
  data: CohortData[];
  metric: string;
  breakpoints: number[];
}
```

#### ✅ CORRECT: Read-Only Props
```typescript
interface ComponentProps {
  readonly data: CohortData[];
  readonly metric: string;
  readonly breakpoints: number[];
  readonly onCellClick?: (cohortDate: string, breakpoint: number, value: number | null) => void;
}
```

### Accessibility Patterns

#### ❌ WRONG: Click Without Keyboard Support
```typescript
<div onClick={handleClick}>
  {cell.displayValue}
</div>
```

#### ✅ CORRECT: Full Accessibility Support
```typescript
<div
  role="button"
  tabIndex={0}
  className={cn(
    "flex h-8 cursor-pointer items-center justify-center rounded-sm text-xs font-medium transition-all hover:scale-105 hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
    cell.heatmapClass,
  )}
  onClick={() => {
    handleCellClick(cohort.cohortDate, cell.breakpoint, cell.value);
  }}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCellClick(cohort.cohortDate, cell.breakpoint, cell.value);
    }
  }}
  title={`Cohort: ${new Date(cohort.cohortDate).toLocaleDateString()}, Day ${cell.breakpoint} - ${formatValue(cell.value ?? 0, metric)}`}
>
  {cell.displayValue}
</div>
```

### Arrow Function Coercion

#### ❌ WRONG: Unnecessary Arrow Functions
```typescript
// ❌ Will trigger unicorn/prefer-native-coercion-functions
labelFormatter={(label) => String(label)}
tickFormatter={(value) => Number(value)}
```

#### ✅ CORRECT: Direct Coercion
```typescript
// ✅ Use native coercion functions directly
labelFormatter={String}
tickFormatter={Number}

// ✅ Or explicit functions when logic is needed
labelFormatter={(label) => {
  return String(label);
}}
```

### Variable Assignment Patterns

#### ❌ WRONG: Modifying Const Variables
```typescript
const dataPoint: Record<string, unknown> = { breakpoint, day: `Day ${breakpoint}` };
dataPoint = setChartDataProperty(dataPoint, cohortKey, value); // Error!
```

#### ✅ CORRECT: Use Let for Reassignment
```typescript
let dataPoint: Record<string, unknown> = { breakpoint, day: `Day ${breakpoint}` };
dataPoint = setChartDataProperty(dataPoint, cohortKey, value); // OK!

// ✅ Or use immutable patterns
const initialData = { breakpoint, day: `Day ${breakpoint}` };
const updatedData = setChartDataProperty(initialData, cohortKey, value);
```

### Loop Patterns

#### ❌ WRONG: Traditional For Loops
```typescript
// ❌ Will trigger unicorn/no-for-loop
for (let i = 0; i < entries.length; i++) {
  const [key, value] = entries[i];
  result[key] = value;
}
```

#### ✅ CORRECT: For-Of Loops
```typescript
// ✅ Use for-of loops
for (const [key, value] of entries) {
  result[key] = value;
}

// ✅ Or array methods when appropriate
entries.forEach(([key, value]) => {
  result[key] = value;
});
```

### Global Object Access

#### ❌ WRONG: Direct Window Access
```typescript
// ❌ Will trigger unicorn/prefer-global-this
if (typeof window === "undefined") return false;
return window.innerWidth < 768;
```

#### ✅ CORRECT: GlobalThis Access
```typescript
// ✅ Use globalThis for consistency
if (globalThis.window == undefined) return false;
return globalThis.window.innerWidth < 768;
```

## ✅ Correct Patterns (Production-Ready)

### Database Queries (Pragmatic Approach)

```typescript
// ✅ CORRECT: Prisma queries (unsafe rules disabled for flexibility)
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
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
    data: { ...data, lastLoginAt: new Date() },
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

### For Security Object Injection Warnings

```typescript
// Before: Dynamic property access
const value = data[dynamicKey]; // Security warning

// After: Safe validation + access
const getValue = (data: Record<string, unknown>, key: string): unknown => {
  if (typeof key !== "string" || !validateKey(key)) {
    return undefined;
  }
  if (key in data) {
    return data[key];
  }
  return undefined;
};
```

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

### For Arrow Function Coercion

```typescript
// Before: Unnecessary arrow function
.map(item => String(item))
labelFormatter={(label) => String(label)}

// After: Direct coercion
.map(String)
labelFormatter={String}
```

### For Loop Modernization

```typescript
// Before: Traditional for loop
for (let i = 0; i < items.length; i++) {
  process(items[i]);
}

// After: For-of loop
for (const item of items) {
  process(item);
}
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

# Check specific directory for security issues
npx eslint ./src/components/reports/charts/ --max-warnings 0
```

## 🎯 Key Differences from Strict Config

1. **TypeScript Safety**: Unsafe rules are OFF for flexibility
2. **Import Order**: WARN level (won't block CI)
3. **Prettier**: WARN level (won't block CI)
4. **Function Scoping**: Recommended but not enforced
5. **Unused Imports**: AUTO-REMOVED by plugin
6. **Switch Exhaustiveness**: ERROR level (enforced)
7. **Async/Await**: ERROR level (enforced)
8. **Security Rules**: WARN level (with safe patterns documented)

## 🏗️ Chart Component Utility Pattern

When working with chart components, always use the safe utility functions:

```typescript
// ✅ Import safe utilities
import {
  getBreakpointValue,
  getMetricConfig,
  getCohortColorSafe,
  getChartDataProperty,
  setChartDataProperty,
  validateChartConfigKey,
  getValidBreakpointValues,
} from "./chart-utils";

// ✅ Use in components
const value = getBreakpointValue(cohort.breakpointValues, breakpoint);
const config = getMetricConfig(metricConfigs, metric);
const color = getCohortColorSafe(colors, index);
```

This prevents security warnings and ensures type-safe property access across all chart components.

---

_Follow these patterns for clean, maintainable code that passes CI without token waste on fixes._
