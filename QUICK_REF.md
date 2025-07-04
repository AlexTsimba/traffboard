# TraffBoard Quick Reference

## 🚀 Commands You'll Use Most

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run db:push          # Push schema changes to DB
npm run db:studio        # Open Drizzle Studio

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
```

## 📱 Key File Locations

```
src/app/page.tsx         # Home page
src/app/layout.tsx       # Root layout
src/app/api/*/route.ts   # API endpoints
src/db/schema/           # Database schemas
src/components/ui/       # shadcn components
```

## 🔧 Quick Fixes

### Environment Setup

```bash
# Copy and configure
cp .env.example .env.local
# Add your DATABASE_URL
```

### Add New Component

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
```

### Database Schema Change

```bash
# 1. Edit src/db/schema/*.ts
# 2. Push to DB
npm run db:push
```

## 🎯 Current Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Drizzle ORM
- **UI**: React 19 + shadcn/ui + Tailwind
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest (add tests after MVP works)

## 🚨 Common Gotchas

1. **Use `edit_block` for small changes** (not `write_file`)
2. **Check imports** when TypeScript errors occur
3. **Restart dev server** after environment changes
4. **Use absolute imports** (`@/components/...`)
5. **Database URL must include `?sslmode=require` for production**
