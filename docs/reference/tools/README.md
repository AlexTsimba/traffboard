---
title: "Tools & Automation Reference"
description: "Documentation for development tools, automation, and AI assistance"
type: "reference"
audience: ["ai-engineer", "frontend-dev", "architect"]
tags: ["tools", "automation", "reference"]
---

# Tools & Automation Reference

Comprehensive documentation for all development tools, automation systems, and AI assistants used in TraffBoard development.

## 📋 Available Tools

| Tool | Purpose | Status | Documentation |
|------|---------|---------|---------------|
| **[Agent Tools](./agents/README.md)** | AI engineering protocols | ✅ Active | Agent configuration and best practices |
| **[Taskmaster](./taskmaster/README.md)** | Project management workflow | ✅ Active | Complete workflow documentation |
| **GitHub Actions** | CI/CD automation | ✅ Active | [GitHub Workflows](#github-workflows) |
| **Development Scripts** | Build & deployment | ✅ Active | [Scripts Reference](#scripts-reference) |

---

## Agent Tools

### AI Engineering Protocol
- **Purpose**: Standardized guidelines for AI-assisted development
- **Features**: Autonomous execution rules, quality gates, TDD cycle
- **Integration**: Works with Taskmaster and GitHub workflows
- **Documentation**: [agents/README.md](./agents/README.md)

### Key Capabilities
- ✅ Autonomous code writing and testing
- ✅ Quality gate enforcement
- ✅ Research-backed development
- ✅ Continuous subtask execution

---

## Taskmaster

### Project Management Workflow
- **Purpose**: AI-assisted task management and development workflow
- **Features**: Tagged task lists, PRD integration, complexity analysis
- **Integration**: MCP server, CLI tools, AI research capabilities
- **Documentation**: [taskmaster/README.md](./taskmaster/README.md)

### Core Features
- 🎯 **Basic Loop**: list → next → show → expand → implement → update → complete
- 🏷️ **Multi-Context**: Tagged task lists for feature branches and collaboration
- 📄 **PRD Integration**: Generate tasks from Product Requirements Documents
- 🔍 **Research**: AI-powered research with project context

---

## GitHub Workflows

### Current Automation

| Workflow | Purpose | Trigger | Status |
|----------|---------|---------|---------|
| **CI Pipeline** | Build, test, type-check | Push, PR | ✅ Active |
| **Security Analysis** | CodeQL, audit | Push, PR | ✅ Active |
| **Deployment** | Deploy to DO App Platform | Push to main | 🔄 Planned |

### Workflow Files
```
.github/workflows/
├── ci.yml              # Main CI pipeline
├── security-analysis.yml  # Security scanning
└── deploy.yml          # Deployment automation (planned)
```

### Security Features
- **CodeQL Analysis**: Automated code security scanning
- **Dependency Audit**: Check for vulnerable dependencies
- **Conventional Commits**: Automated commit message validation

---

## Scripts Reference

### Development Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `pnpm dev` | Start development server | Local development |
| `pnpm build` | Production build | CI/CD, deployment |
| `pnpm test` | Run test suite | Quality assurance |
| `pnpm lint` | Code linting | Code quality |
| `pnpm type-check` | TypeScript validation | Type safety |

### Quality Gates
```bash
# Complete quality gate check
pnpm lint && pnpm type-check && pnpm test && pnpm build
```

### Package Management
- **Package Manager**: pnpm (preferred for performance)
- **Lock File**: pnpm-lock.yaml
- **Node Version**: Specified in .nvmrc
- **Dependencies**: Managed through package.json

---

## Tool Integration

### MCP (Model Context Protocol)
- **Purpose**: Enable AI tools to interact with development environment
- **Integration**: Taskmaster, file operations, research capabilities
- **Configuration**: .cursor/mcp.json

### Context7
- **Purpose**: Real-time library documentation and examples
- **Integration**: Research tool, development guidance
- **Usage**: Automatic library documentation lookup

### Development Environment
- **IDE Support**: Cursor (recommended), VS Code compatible
- **Extensions**: ESLint, Prettier, TypeScript, Tailwind CSS
- **Configuration**: Shared through .vscode/ and .cursor/ directories

---

## Best Practices

### Tool Usage Guidelines

1. **Taskmaster First**: Use Taskmaster for all project planning and task management
2. **Quality Gates**: Always run full quality gates before commits
3. **Research Integration**: Leverage AI research for up-to-date best practices
4. **Automation**: Prefer automated solutions over manual processes

### Workflow Integration

1. **Planning**: Start with Taskmaster task list and complexity analysis
2. **Development**: Use agent protocols for autonomous development
3. **Quality**: Enforce quality gates through CI/CD
4. **Deployment**: Automated deployment through GitHub Actions

### Troubleshooting

#### Common Issues
- **Taskmaster**: Check MCP server status and API keys
- **CI/CD**: Verify workflow permissions and secrets
- **Quality Gates**: Review linting and type errors
- **Agent Tools**: Ensure proper configuration and context

#### Support Resources
- **Taskmaster**: [taskmaster/README.md](./taskmaster/README.md)
- **Agent Configuration**: [agents/README.md](./agents/README.md)
- **Development Setup**: [../../how-to/development/README.md](../../how-to/development/README.md)

---

## Related Documentation

- **[Development How-To](../../how-to/development/README.md)** - Setup and development guides
- **[Operations How-To](../../how-to/operations/README.md)** - Deployment and maintenance
- **[Architecture Reference](../api/README.md)** - System architecture documentation

---

**Navigation:** [← Reference Home](../README.md) | [Agent Tools →](./agents/README.md) | [Taskmaster →](./taskmaster/README.md) 