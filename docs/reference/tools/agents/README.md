---
title: "Agent Tools & Configuration"
description: "Configuration and best practices for AI agents working with TraffBoard"
type: "reference"
audience: ["ai-engineer", "frontend-dev"]
tags: ["agents", "automation", "taskmaster", "ai"]
---

# Agent Tools & Configuration

AI agent setup and protocols for TraffBoard development automation.

## Agent Protocol Overview

Standardized guidelines for AI-assisted development with autonomous execution and quality gates.

### Core Principles
- **Autonomous Execution**: Agents operate independently within defined rules
- **Quality Gates**: Mandatory testing and validation at each step
- **Research Integration**: Use up-to-date information beyond training data
- **Iterative Development**: TDD cycle with continuous improvement

## Agent Workflow

### Standard Development Cycle
1. **Task Analysis**: Understand requirements and acceptance criteria
2. **Research Phase**: Gather current best practices and patterns
3. **Implementation**: Write code following TDD principles
4. **Testing**: Ensure all tests pass before proceeding
5. **Documentation**: Update relevant documentation
6. **Quality Check**: Run linting, type checking, and build validation

### Quality Gates
Each development step must pass these gates:
- ✅ **Tests Pass**: All existing and new tests must pass
- ✅ **Types Valid**: TypeScript compilation without errors
- ✅ **Linting Clean**: ESLint passes without warnings
- ✅ **Build Success**: Production build completes successfully

## Agent Configuration

### Essential Tools
- **Cursor IDE**: Primary development environment
- **Taskmaster**: Project management and task tracking
- **Context7**: Real-time library documentation
- **Web Research**: Current best practices and updates

### Development Rules
- **Test-Driven Development**: Write tests before implementation
- **Incremental Progress**: Small, verifiable changes
- **Documentation First**: Update docs with code changes
- **Performance Aware**: Consider Core Web Vitals impact

## Research-Backed Development

### When to Research
- ✅ New technologies or libraries being introduced
- ✅ Security-related implementations
- ✅ Performance optimization needs
- ✅ Best practice verification for complex features

### Research Tools
```bash
# Built-in research capabilities
pnpm taskmaster research "Next.js 15 App Router patterns" --files=src/app/

# Context7 for library docs
# Automatic lookup for current library documentation

# Web search for latest practices
# Real-time information beyond training data
```

## Development Patterns

### Component Development
1. **Research**: Current component patterns and accessibility requirements
2. **Design**: Plan component API and props interface
3. **Test**: Write component tests with realistic use cases
4. **Implement**: Build component following established patterns
5. **Document**: Add component to documentation

### Feature Implementation
1. **Analysis**: Break down feature into testable units
2. **Architecture**: Plan integration with existing systems
3. **TDD Cycle**: Red → Green → Refactor for each unit
4. **Integration**: Ensure feature works within larger system
5. **Performance**: Validate Core Web Vitals impact

## Autonomous Operation Guidelines

### What Agents Can Do Independently
- ✅ Write and refactor code following established patterns
- ✅ Create and update tests for new functionality
- ✅ Research current best practices and implement them
- ✅ Update documentation to reflect code changes
- ✅ Fix linting and type errors

### What Requires Human Input
- ❌ Major architectural decisions
- ❌ Breaking changes to public APIs
- ❌ Security-related configuration changes
- ❌ Deployment and infrastructure modifications

## 🔄 **CRITICAL: Subtask Development Process**

### **MANDATORY: Test-Driven Development (TDD)**
Every subtask MUST include comprehensive test creation:

1. **📝 Test Planning Phase**
   - Identify what needs to be tested (functions, configurations, integrations)
   - Create test files in appropriate `__tests__/` directories
   - Write failing tests first (Red phase)

2. **🧪 Test Implementation Requirements**
   ```bash
   # Test file structure examples
   src/db/__tests__/connection.test.ts        # Unit tests for database connection
   src/__tests__/api/health.test.ts          # Integration tests for API endpoints
   src/components/__tests__/MyComponent.test.tsx  # Component tests
   ```

3. **⚠️ NO SUBTASK WITHOUT TESTS**
   - ❌ **NEVER mark subtask "done" without comprehensive tests**
   - ❌ **NEVER commit code without accompanying tests**
   - ❌ **NEVER skip test creation "for speed"**

### **Mandatory Quality Gates for Every Subtask**
Each subtask MUST follow this exact sequence before being marked "done":

1. **TDD Cycle**
   ```bash
   # 1. RED: Write failing tests first
   pnpm test         # Should fail initially
   
   # 2. GREEN: Implement minimal code to pass
   # Write implementation code
   pnpm test         # Should pass now
   
   # 3. REFACTOR: Clean up code while keeping tests green
   pnpm test         # Should still pass
   ```

2. **Local Development**
   ```bash
   # All quality gates must pass
   pnpm build        # MUST pass
   pnpm test         # MUST pass (includes new tests)
   pnpm lint         # MUST pass
   ```

3. **Commit Process**
   ```bash
   # Commit naming convention
   git commit -m "feat(module): implement subtask description - refs task X.Y"
   
   # Examples:
   # "feat(database): setup drizzle orm configuration - refs task 2.1"
   # "feat(auth): implement nextauth configuration - refs task 3.2"
   ```

4. **CI Verification**
   ```bash
   git push origin feature-branch
   # Wait for GitHub Actions to pass
   # Only mark subtask "done" after CI ✅
   ```

### **Test Coverage Requirements**
- **Unit Tests**: Test individual functions, classes, utilities
- **Integration Tests**: Test API endpoints, database connections, component integration
- **Component Tests**: Test React components with realistic props and user interactions
- **Configuration Tests**: Test environment variables, database configs, build settings

### **Subtask Requirements**
- ⚠️ **ONE commit per subtask** (not per task)
- ⚠️ **Each subtask must be atomic** and testable independently
- ⚠️ **NO subtask marked "done"** without passing all quality gates
- ⚠️ **Every subtask must pass CI/CD** before proceeding to next
- ⚠️ **Every subtask must include tests** covering new functionality

### **Quality Gate Enforcement**
```typescript
// Quality gates checklist per subtask:
const qualityGates = {
  testsWritten: '✅ Comprehensive tests created for new functionality',
  testsPass: '✅ All tests pass (old + new)',
  localBuild: '✅ pnpm build passes',
  localTests: '✅ pnpm test passes', 
  localLint: '✅ pnpm lint passes',
  atomicCommit: '✅ Single focused commit with tests included',
  ciPasses: '✅ GitHub Actions passes',
  subtaskComplete: '✅ Mark as done only after all above'
};
```

**❌ NEVER skip quality gates or mark subtasks done without full validation including tests**

## Integration with TraffBoard

### Project-Specific Guidelines
- **Component Library**: Use shadcn/ui components with consistent theming
- **State Management**: Prefer React hooks and Context API over external libraries
- **Styling**: Tailwind CSS utility classes with semantic naming
- **Performance**: Optimize for Core Web Vitals, especially LCP and CLS

### Code Quality Standards
- **TypeScript**: Strict type checking enabled
- **Testing**: Vitest with comprehensive component and integration tests
- **Accessibility**: WCAG 2.1 compliance for all interactive elements
- **Performance**: Bundle size awareness and lazy loading where appropriate

---

**Navigation**: [← Tools Overview](../README.md) | [Taskmaster](../taskmaster/) | [Reference Home](../../README.md) 