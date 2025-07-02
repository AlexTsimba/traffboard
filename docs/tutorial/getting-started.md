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

Welcome to TraffBoard! This tutorial will guide you through setting up your development environment and running the application locally.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **pnpm** package manager ([Install pnpm](https://pnpm.io/installation))
- **Git** for version control
- **VS Code or Cursor** (recommended IDEs)

### Quick Prerequisites Check

```bash
# Check Node.js version (should be 18+)
node --version

# Check pnpm installation
pnpm --version

# Check Git installation
git --version
```

---

## 🚀 Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/AlexTsimba/traffboard.git

# Navigate to project directory
cd traffboard

# Check current branch
git branch
```

**Expected Output:**
```
* feature/docs-restructure  # or main
```

---

## 📦 Step 2: Install Dependencies

TraffBoard uses **pnpm** for fast, efficient package management:

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

**What gets installed:**
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **Testing libraries** - Vitest, Testing Library

---

## ⚙️ Step 3: Environment Setup

Create your local environment configuration:

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
code .env.local  # or nano .env.local
```

**Environment Variables:**
```env
# Basic configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (when implemented)
# DATABASE_URL=postgresql://...

# Authentication (when implemented)
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret-here
```

---

## 🏃‍♂️ Step 4: Start Development Server

Launch the development server:

```bash
# Start the development server
pnpm dev
```

**Expected Output:**
```
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.1s
```

**🎉 Success!** Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧭 Step 5: Explore the Application

### Main Areas

1. **Dashboard** (`/main/dashboard`) - Main application interface
2. **Authentication** (`/main/auth`) - Login/register pages
3. **Preferences** (`/main/dashboard/preferences`) - User settings
4. **Analytics** (`/main/dashboard/conversions`) - Data visualization

### Navigation Structure

```
TraffBoard/
├── Landing Page (/)           # Public landing
├── External Page (/external)  # External traffic demo
└── Main App (/main)          # Authenticated area
    ├── Auth (/main/auth)
    │   ├── Login
    │   └── Register
    └── Dashboard (/main/dashboard)
        ├── Overview
        ├── Conversions
        ├── Administration
        └── Preferences
```

---

## 🧪 Step 6: Run Quality Checks

Verify everything is working correctly:

```bash
# Run all quality checks
pnpm lint && pnpm type-check && pnpm test && pnpm build
```

**Individual Commands:**
```bash
# Code linting
pnpm lint

# TypeScript validation
pnpm type-check

# Test suite
pnpm test

# Production build
pnpm build
```

**Expected Results:**
- ✅ No linting errors
- ✅ No TypeScript errors  
- ✅ All tests pass
- ✅ Build completes successfully

---

## 🎨 Step 7: Explore the UI Components

TraffBoard uses **shadcn/ui** components with **Tailwind CSS v4**:

### Key Features
- **Responsive Design** - Works on all devices
- **Dark/Light Mode** - Toggle in preferences
- **Modern Components** - Accessible, well-designed
- **Customizable Themes** - Multiple color schemes

### Test UI Features

1. **Navigation** - Try the sidebar and mobile menu
2. **Themes** - Switch between light/dark mode
3. **Data Tables** - Explore the interactive tables
4. **Forms** - Test the authentication forms
5. **Charts** - View analytics visualizations

---

## 📁 Step 8: Understand Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/           # Main application
│   │   ├── auth/         # Authentication pages
│   │   └── dashboard/    # Dashboard pages
│   ├── external/         # External landing
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   └── data-table/      # Table components
├── lib/                 # Utilities
├── hooks/               # Custom React hooks
└── __tests__/           # Test files
```

---

## 🔧 Step 9: Development Tools Setup

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Cursor AI Setup (Recommended)

TraffBoard is optimized for [Cursor](https://cursor.sh/) with AI assistance:

1. **Install Cursor** from cursor.sh
2. **Open Project** in Cursor
3. **AI Features** - Use Cmd+K for AI assistance
4. **Agent Integration** - Configured for autonomous development

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