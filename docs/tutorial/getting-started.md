---
title: "Getting Started with TraffBoard"
description: "Complete beginner's guide to setting up and running TraffBoard locally"
type: "tutorial"
audience: ["frontend-dev", "ai-engineer"]
tags: ["getting-started", "setup", "nextjs", "development"]
difficulty: "beginner"
duration: "30 minutes"
---

# Getting Started with TraffBoard

Complete beginner's guide to setting up and running TraffBoard locally.

## Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **pnpm** ([Install](https://pnpm.io/installation))
- **Git** for version control

### Quick Check
```bash
node --version    # Should be 18+
pnpm --version    # Should be 8+
```

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd traffboard
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Start Development Server
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── main/dashboard/     # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
└── lib/                  # Utilities and configurations
```

## Essential Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Code linting
```

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** following [commit conventions](../how-to/development/commit-conventions.md)
3. **Test**: `pnpm test && pnpm build`
4. **Commit**: `git commit -m "feat: your feature"`

## Key Features Overview

- **Dashboard**: Interactive analytics with charts
- **Authentication**: NextAuth.js with Google OAuth
- **UI Components**: shadcn/ui with Tailwind CSS
- **Dark/Light Theme**: Automatic system detection
- **Responsive**: Mobile-first design

## Environment Setup

Create `.env.local`:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Next Steps

- **[Development Setup](../how-to/development/)** - Advanced configuration
- **[Component Library](../reference/components/)** - Available UI components  
- **[API Reference](../reference/api/)** - Backend endpoints

## Troubleshooting

**Port already in use?**
```bash
pnpm dev --port 3001
```

**Dependencies issues?**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Need help?** Check [GitHub Issues](https://github.com/AlexTsimba/traffboard/issues)

---

## 🎯 Next Steps

Now that you have TraffBoard running locally, here's what to explore next:

### Immediate Next Steps
- **[Architecture Overview](../explanation/architecture/README.md)** - Understand the system design
- **[Development Workflow](../how-to/development/README.md)** - Learn the development process
- **[Component Library](../reference/components/README.md)** - Explore available components

### Advanced Topics
- **[Taskmaster Setup](../how-to/ai-integration/taskmaster-setup.md)** - AI-assisted development
- **[Deployment Guide](../how-to/operations/deployment.md)** - Deploy to production
- **[Testing Strategy](../how-to/development/testing.md)** - Comprehensive testing

### Development Features
- **[AI Integration](../how-to/ai-integration/README.md)** - AI-powered development tools
- **[Customization Guide](../how-to/customization/README.md)** - Customize themes and components

---

## 🆘 Troubleshooting

### Common Issues

#### Development Server Won't Start
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm dev
```

#### Port Already in Use
```bash
# Use different port
pnpm dev --port 3001
```

#### Build Errors
```bash
# Check for type errors
pnpm type-check

# Check for linting issues
pnpm lint --fix
```

#### Environment Issues
- Verify `.env.local` exists and has correct format
- Check Node.js version is 18+
- Ensure pnpm is installed globally

### Getting Help

- **Documentation**: Browse the [docs](../README.md) for detailed guides
- **Issues**: Report bugs on [GitHub Issues](https://github.com/AlexTsimba/traffboard/issues)
- **Discussions**: Join discussions on [GitHub Discussions](https://github.com/AlexTsimba/traffboard/discussions)

---

## ✅ Completion Checklist

- [ ] Repository cloned successfully
- [ ] Dependencies installed with pnpm
- [ ] Environment variables configured
- [ ] Development server running on localhost:3000
- [ ] All quality checks pass
- [ ] UI components and navigation explored
- [ ] Project structure understood
- [ ] Development tools configured

**🎉 Congratulations!** You've successfully set up TraffBoard for local development.

---

**Navigation:** [← Tutorial Home](./README.md) | [Architecture Overview →](../explanation/architecture/README.md) | [Development Workflow →](../how-to/development/README.md) 