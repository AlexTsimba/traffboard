# Taskmaster Development Workflow

AI-powered project management and development workflow tool for TraffBoard.

## Quick Reference

| Topic | Description |
|-------|-------------|
| **Basic Workflow** | `list` → `next` → `show` → `expand` → implement → `set-status` |
| **Multi-Context** | Tagged task lists for feature branches |
| **Research** | AI-powered research with project context |

## Core Concepts

### The Basic Loop
1. **`list`** - Show current tasks
2. **`next`** - Find next task to work on
3. **`show <id>`** - View task details
4. **`expand <id>`** - Break down complex tasks
5. **Implement** - Write code and tests
6. **`set-status <id> done`** - Mark completion

### Tagged Task Lists
- **master** - Main development tasks
- **feature-xyz** - Feature-specific tasks
- **experiment-abc** - Experimental work

## Essential Commands

### Task Management
```bash
# View tasks
pnpm taskmaster list
pnpm taskmaster next
pnpm taskmaster show 15

# Create and modify
pnpm taskmaster add-task -p "Add user authentication"
pnpm taskmaster expand --id=15 --research
pnpm taskmaster set-status --id=15 --status=done

# Tag management
pnpm taskmaster add-tag feature-auth
pnpm taskmaster use-tag feature-auth
```

### Project Setup
```bash
# Initialize new project
pnpm taskmaster init

# Parse requirements document
pnpm taskmaster parse-prd spec.txt

# Analyze complexity
pnpm taskmaster analyze-complexity --research
```

## When to Use Tags

### Feature Branching
```bash
git checkout -b feature/user-auth
pnpm taskmaster add-tag --from-branch
```

### Team Collaboration
```bash
# Create isolated context
pnpm taskmaster add-tag my-work --copy-from-current
```

### Experiments
```bash
# Sandbox for risky changes
pnpm taskmaster add-tag experiment-zustand
```

## AI Research Integration

### Research with Context
```bash
# Research with task context
pnpm taskmaster research "React Query vs Redux" --id=15,16

# Research with file context
pnpm taskmaster research "Next.js 15 patterns" --files=src/app/layout.tsx

# Save research to task
pnpm taskmaster research "Auth best practices" --save-to=15.3
```

## Task Structure

### Example Task
```json
{
  "id": "15",
  "title": "Implement User Authentication",
  "description": "Add JWT-based authentication system",
  "status": "pending",
  "dependencies": ["14"],
  "priority": "high",
  "details": "Use NextAuth.js with Google OAuth provider...",
  "testStrategy": "Unit tests for auth hooks, integration tests for login flow",
  "subtasks": [
    {
      "id": "15.1",
      "title": "Configure NextAuth.js",
      "status": "pending"
    }
  ]
}
```

## Advanced Workflows

### PRD-Driven Development
1. **Create PRD** in `.taskmaster/docs/prd.txt`
2. **Parse to tasks**: `pnpm taskmaster parse-prd prd.txt`
3. **Analyze complexity**: `pnpm taskmaster analyze-complexity`
4. **Expand tasks**: `pnpm taskmaster expand --all --research`

### Update Workflows
```bash
# Update single task
pnpm taskmaster update-task --id=15 --prompt="Change from JWT to sessions"

# Update multiple future tasks
pnpm taskmaster update --from=20 --prompt="Switch to React Query"

# Log implementation progress
pnpm taskmaster update-subtask --id=15.2 --prompt="Completed OAuth setup"
```

---

**Navigation**: [← Tools Overview](../README.md) | [Agent Tools](../agents/) | [Reference Home](../../README.md) 