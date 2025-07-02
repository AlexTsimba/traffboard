---
title: "Tools & Automation Reference"
description: "Documentation for development tools, automation, and AI assistance"
type: "reference"
audience: ["ai-engineer", "frontend-dev", "architect"]
tags: ["tools", "automation", "reference"]
---

# Tools & Automation Reference

Development tools, automation systems, and AI assistants for TraffBoard development.

## Available Tools

| Tool | Purpose | Status | Documentation |
|------|---------|---------|---------------|
| **[Agent Tools](./agents/)** | AI engineering protocols | ✅ Active | Configuration and best practices |
| **[Taskmaster](./taskmaster/)** | Project management workflow | ✅ Active | Complete workflow documentation |
| **GitHub Actions** | CI/CD automation | ✅ Active | [GitHub Workflows](#github-workflows) |

## Core Development Tools

### AI-Powered Development
- **Cursor IDE**: AI-powered code editor with GitHub Copilot integration
- **AI Agents**: Autonomous development assistance with predefined protocols
- **Taskmaster**: AI-powered project management and task breakdown

### Code Quality & Testing
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting and style consistency
- **Vitest**: Fast unit testing framework
- **TypeScript**: Static type checking

### Build & Development
- **Next.js**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **pnpm**: Fast, disk space efficient package manager

## GitHub Workflows

### Continuous Integration
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
      - name: Build
        run: pnpm build
```

## Quick Setup

### Essential Tools Installation
```bash
# Install Node.js 18+ and pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh

# Clone and setup project
git clone <repo>
cd traffboard
pnpm install
pnpm dev
```

---

**Core Tools**: [Agents](./agents/) | [Taskmaster](./taskmaster/) | [GitHub Actions](#github-workflows)

---

## Related Documentation

- **[Development How-To](../../how-to/development/README.md)** - Setup and development guides
- **[Operations How-To](../../how-to/operations/README.md)** - Deployment and maintenance
- **[Architecture Reference](../api/README.md)** - System architecture documentation

---

**Navigation:** [← Reference Home](../README.md) | [Agent Tools →](./agents/) | [Taskmaster →](./taskmaster/) 