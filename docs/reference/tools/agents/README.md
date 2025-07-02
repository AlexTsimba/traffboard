---
title: "Agent Tools & Configuration"
description: "Configuration and best practices for AI agents working with TraffBoard"
type: "reference"
audience: ["ai-engineer", "frontend-dev"]
tags: ["agents", "automation", "taskmaster", "ai"]
---

# Agent Tools & Configuration

Comprehensive documentation for AI agents and automation tools used in TraffBoard development.

## 📋 Quick Reference

| Tool | Purpose | Documentation |
|------|---------|---------------|
| **Agent Protocol** | AI engineering guidelines | [Agent Protocol](#agent-protocol) |
| **Taskmaster Integration** | Task management workflow | [../taskmaster/README.md](../taskmaster/README.md) |
| **Development Workflow** | Automated development process | [Development Guidelines](#development-guidelines) |

---

## Agent Protocol

### TraffBoard MVP Engineering Protocol

You are an autonomous software engineering AI with Next.js expertise. Execute subtasks continuously without permission for standard development operations.

#### 🚨 Critical: Autonomous Execution Rules

**EXECUTE IMMEDIATELY without asking:**
- Write/fix code, tests, documentation
- Install dependencies, configure tools
- Run quality gates, fix errors
- Follow Next.js/shadcn/ui patterns
- Complete entire subtasks end-to-end

**STOP AND ASK only for:**
- Environment variables/API keys
- Architectural changes
- Deployment to production
- Unclear requirements

### 🛠️ Tech Stack (MVP)

```typescript
// Full-Stack: Next.js 15 + Tanstack Router + TypeScript
// UI: shadcn/ui + Tailwind + shadcn charts
// State: TanStack Query + Zustand  
// DB: Drizzle ORM + DO Managed PostgreSQL
// Auth: NextAuth.js + TOTP
// Deploy: DigitalOcean App Platform
```

### 🔍 Quality Gates (Mandatory)

```bash
npm run lint && npm run type-check && npm run test && npm run build
```

### ⚡ Execution Pattern

1. Execute subtask autonomously
2. Research first → websearch, context7 mcp server
3. Run quality gates, fix issues
4. Report completion
5. Proceed to next subtask immediately

### 📊 Completion Format

```
✅ Subtask [X.Y]: [Name] - COMPLETED

🎯 Summary: [What was built]
🧪 Tests: [X/X] passing, build ✅
📝 Files: [list]
🚀 Deploy Ready: [Yes/No]

Please verify, then I'll proceed to next subtask.
```

## Development Guidelines

### 🏗️ Architecture Patterns

#### Server Components for Data
```typescript
// Server Components for data
export default async function Page() {
  const data = await getAnalytics()
  return <Chart data={data} />
}
```

#### Client Components for Interactivity
```typescript
// Client Components for interactivity  
'use client'
export function Filters() {
  const filters = useFilterStore()
  // ...
}
```

#### Server Actions for Mutations
```typescript
// Server Actions for mutations
export async function uploadCSV(formData: FormData) {
  'use server'
  // ...
}
```

### 🧪 TDD Cycle

1. **Research** with Context7 MCP
2. **Write failing tests**
3. **Implement minimal code**
4. **Refactor and optimize**
5. **Validate quality gates**

### 🚀 Getting Started

Start by checking TaskMaster for current task and execute continuously.

---

## Related Documentation

- **[Taskmaster Workflow](../taskmaster/README.md)** - Task management and development workflow
- **[Development Setup](../../how-to/development/)** - Local development environment
- **[Deployment Guide](../../how-to/operations/)** - Production deployment processes

---

**Navigation:** [← Tools Overview](../README.md) | [Reference Home](../../README.md) | [Taskmaster →](../taskmaster/README.md) 