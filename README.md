# TraffBoard

Enterprise analytics platform for traffic and player data analysis with modular reporting architecture.

## 🚀 Quick Start

```bash
# Install and setup
pnpm install
cp .env.example .env.local  # Edit with your database credentials
pnpm db:push && pnpm db:seed && pnpm dev
```

**Default Login**: `admin@traffboard.com` / `admin123`

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Database**: PostgreSQL + Prisma ORM  
- **Auth**: NextAuth.js v5 with role-based access
- **UI**: shadcn/ui + Tailwind CSS + Recharts
- **State**: Zustand stores with persistence
- **Testing**: Vitest + React Testing Library + Real PostgreSQL

## 📊 Features

### ✅ Production Ready
- **Report Factory Foundation** - Universal filters, data pipelines, plugin system
- **User Management** - Role-based access, admin interface, CSV import
- **Authentication** - Secure NextAuth.js v5 implementation
- **Quality Assurance** - 87+ tests, strict TypeScript, comprehensive linting

### 🚧 In Development  
- **Cohort Analysis** - Player behavior tracking with Dep2Cost/ROAS metrics
- **Performance Optimization** - Advanced caching and query optimization

### 📋 Planned
- **Funnel Analysis** - Conversion tracking reports
- **Retention Analysis** - Player lifecycle insights
- **Attribution Analysis** - Marketing effectiveness measurement

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Setup, commands, workflows
- **[System Architecture](docs/ARCHITECTURE.md)** - Tech stack, patterns, security
- **[Report Factory](docs/REPORTS.md)** - Modular reporting system guide

## 🧪 Quality Standards

```bash
pnpm test           # 87+ comprehensive tests  
pnpm lint           # ESLint + Prettier
pnpm type-check     # Strict TypeScript
pnpm build          # Production validation
```

**Current Status**: Production-ready foundation with clean test suite, proper TypeScript architecture, and working Report Factory system ready for team scaling. 