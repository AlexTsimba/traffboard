# TraffBoard Development Guide - Claude Sonnet 4

## 🎯 Core Principles

**Mission**: Build production-ready features using TraffBoard's modular architecture with zero-debugging development practices.

**Identity**: Senior AI Agent specializing in TypeScript/Next.js, emphasizing clean code patterns that prevent bugs before they occur.

## 🏗️ Modular Architecture Overview

TraffBoard uses a **Modular Factory Pattern** designed for maintainability and debugging prevention:

### **Report Factory System** (Production Ready)
```
src/lib/reports/
├── data-pipeline.ts           # Main orchestrator
├── pipeline/
│   ├── data-extractors.ts     # 108 lines - Data source handling
│   ├── data-transformers.ts   # 264 lines - Transform operations
│   ├── filter-utils.ts        # 137 lines - Prisma query builders
│   ├── cache-manager.ts       # 143 lines - TTL caching system
│   ├── transform-builder.ts   # 97 lines - Builder pattern
│   └── pipeline-factory.ts    # 227 lines - Factory functions
└── export/
    └── export-system.ts       # Multi-format export handling
```

**Architecture Benefits:**
- **Single Responsibility**: Each module has one clear purpose
- **Easy Testing**: Components can be tested in isolation
- **Zero Circular Dependencies**: Clean import hierarchy
- **Type Safety**: Comprehensive TypeScript interfaces

### **Component Organization**
```
src/components/reports/
├── universal/                 # Shared components
│   └── report-header.tsx      # Universal report header
├── filters/                   # Filter system components
│   ├── filter-system.tsx      # Modal + chips components
│   ├── filter-composer.ts     # Filter building utilities
│   └── filter-validation.ts   # Validation logic
└── [feature]/                 # Feature-specific components
```

## 🛡️ Zero-Debugging Development Practices

### **1. Type-First Development**
```typescript
// ✅ Define interfaces before implementation
interface CohortData {
  readonly userId: string;
  readonly cohortDate: Date;
  readonly retentionDays: readonly number[];
}

// ✅ Use strict TypeScript compiler settings
"strict": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true
```

### **2. Defensive Programming Patterns**
```typescript
// ✅ Validate inputs early
function processCohortData(data: unknown[]): CohortData[] {
  if (!Array.isArray(data)) {
    throw new Error('Expected array input');
  }
  
  return data.map((item, index) => {
    if (!isValidCohortItem(item)) {
      throw new Error(`Invalid cohort item at index ${index}`);
    }
    return transformToCohortData(item);
  });
}

// ✅ Use readonly properties to prevent mutation
interface FilterState {
  readonly appliedFilters: readonly AppliedFilter[];
  readonly isLoading: boolean;
}
```

### **3. Error Boundary Patterns**
```typescript
// ✅ Wrap risky operations in try-catch
async function fetchCohortData(filters: AppliedFilter[]): Promise<CohortData[]> {
  try {
    const result = await extractData({ 
      source: 'prisma', 
      query: buildCohortQuery(filters) 
    });
    
    if (!result.success) {
      throw new Error(`Query failed: ${result.error}`);
    }
    
    return result.data;
  } catch (error) {
    console.error('Cohort data fetch failed:', error);
    throw new CohortDataError('Failed to load cohort data', { cause: error });
  }
}
```

### **4. Comprehensive JSDoc Documentation**
```typescript
/**
 * Builds Prisma where clause for cohort analysis
 * 
 * @param filters - Applied filters from user interface
 * @param dateRange - Analysis period constraints  
 * @returns Prisma-compatible where clause
 * 
 * @example
 * ```typescript
 * const where = buildCohortWhereClause(
 *   [{ id: 'partner_ids', value: ['partner1', 'partner2'] }],
 *   { start: new Date('2024-01-01'), end: new Date('2024-12-31') }
 * );
 * ```
 * 
 * @throws {CohortValidationError} When filters contain invalid date ranges
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting}
 */
function buildCohortWhereClause(
  filters: readonly AppliedFilter[],
  dateRange: DateRange
): Prisma.ConversionWhereInput
```

## 🔧 Development Workflow

### **1. Session Initialization**
```bash
# Load project state
pnpm dev                           # Start development server
pnpm lint                          # Check code quality
pnpm type-check                    # Validate TypeScript
pnpm test                          # Run test suite
```

### **2. Feature Development Pattern**
```typescript
// 1. Define types first (src/types/reports.ts)
interface CohortAnalysisConfig {
  readonly cohortPeriod: 'daily' | 'weekly' | 'monthly';
  readonly retentionPeriods: readonly number[];
  readonly dateRange: DateRange;
}

// 2. Create utilities (src/lib/reports/cohort/)
export function calculateRetention(data: CohortData[]): RetentionMatrix {
  // Implementation with comprehensive error handling
}

// 3. Build components (src/components/reports/cohort/)
export function CohortAnalysisChart({ config }: CohortAnalysisProps) {
  // Component with proper error boundaries
}

// 4. Write tests (tests/cohort/)
describe('CohortAnalysis', () => {
  it('calculates retention correctly', () => {
    // Comprehensive test cases
  });
});
```

### **3. Quality Gates**
```bash
# Before committing any code:
pnpm lint --fix                   # Auto-fix linting issues
pnpm type-check                   # Ensure type safety
pnpm test                         # Validate functionality
pnpm build                        # Confirm production build
```

## 📚 Essential Resources

### **Anthropic Best Practices**
- [Claude Documentation](https://docs.anthropic.com/claude/docs/intro-to-claude) - Core capabilities and limitations
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering) - Effective communication patterns
- [Safety Best Practices](https://docs.anthropic.com/claude/docs/safety-best-practices) - Responsible AI development

### **TypeScript Excellence**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Complete language reference
- [Total TypeScript](https://www.totaltypescript.com/) - Advanced patterns and best practices
- [Type Challenges](https://github.com/type-challenges/type-challenges) - Skill improvement exercises

### **Next.js App Router**
- [Next.js Documentation](https://nextjs.org/docs) - Framework fundamentals
- [App Router Guide](https://nextjs.org/docs/app) - Modern routing patterns
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components) - Performance optimization

### **Testing & Quality**
- [Vitest Documentation](https://vitest.dev/) - Testing framework
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing patterns
- [ESLint Rules](https://eslint.org/docs/latest/rules/) - Code quality standards

## 🧠 Memory System Commands (Claude Desktop)

```bash
# Project context and learnings
memory:search "TraffBoard patterns"        # Load successful implementations
memory:add "pattern: [description]"       # Store new patterns
memory:update "[entity]" "[new_info]"     # Update existing knowledge

# Task management integration  
memory:search "debugging techniques"      # Load debugging strategies
memory:add "lesson: [specific_learning]"  # Store debugging lessons
```

## 🎯 Current Project Status

### **Production Ready Systems**
- ✅ **Report Factory Foundation** - Complete modular architecture
- ✅ **Filter System** - Universal components with validation
- ✅ **Data Pipeline** - Extraction, transformation, caching
- ✅ **Export System** - Multi-format report exports
- ✅ **Quality Standards** - 0 lint warnings, comprehensive tests

### **Development Standards Achieved**
- **Code Quality**: ESLint + Prettier with strict rules
- **Type Safety**: Complete TypeScript coverage with strict mode
- **Test Coverage**: Comprehensive test suites (87+ tests passing)
- **Performance**: Optimized build with proper chunking
- **Documentation**: JSDoc comments and architectural guides

### **Next Phase Ready**
The codebase is in production-ready state for implementing:
- **Cohort Analysis** (Task 2) - All infrastructure in place
- **Advanced Analytics** - Extensible plugin architecture
- **Performance Optimization** - Monitoring and caching systems

## 💡 Quick Reference

### **Common Commands**
```bash
pnpm dev                          # Development server
pnpm build                        # Production build  
pnpm lint --fix                   # Fix linting issues
pnpm test --watch                 # Watch mode testing
pnpm db:studio                    # Database management
```

### **File Patterns**
- **Types**: `src/types/[domain].ts` - Comprehensive interfaces
- **Components**: `src/components/[domain]/[feature].tsx` - React components  
- **Logic**: `src/lib/[domain]/[feature].ts` - Business logic
- **Tests**: `tests/[domain]/[feature].test.ts` - Test suites

### **Import Conventions**
```typescript
// ✅ Use absolute imports
import { CohortData } from '@/types/reports';
import { buildCohortQuery } from '@/lib/reports/cohort';

// ✅ Group imports logically
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { CohortAnalysisProps } from '@/types/reports';
```
