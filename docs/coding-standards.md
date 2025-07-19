# Coding Standards

## Next.js Specific Rules
- **Server Actions**: All data fetching/mutations must use Next.js Server Actions, never direct client-side DB access
- **API Routes**: Use Next.js API Routes only for file uploads or external integrations
- **Server Components**: Prefer React Server Components for data fetching over client-side
- **Route Groups**: Use (auth) and (dashboard) route grouping patterns

## Type Safety & Sharing
- **Shared Types**: Define data models in `packages/shared/src/types/` and import across monorepo
- **Type Imports**: Use `import type` for type-only imports
- **No Any**: Avoid `any` type, use `unknown` or proper typing
- **Database Types**: Generate types from Prisma/Drizzle schema

## Component Architecture
- **Shadcn UI**: Use Shadcn components as base, customize via className prop
- **Component Props**: Always define TypeScript interfaces for component props
- **Server vs Client**: Mark client components with "use client" directive only when needed
- **Layout Components**: Keep layout logic in Next.js layout.tsx files

## Authentication & Security
- **better-auth**: Use better-auth for all authentication logic
- **Session Validation**: Validate sessions in Server Actions/API Routes
- **Role Checks**: Implement role-based access in server-side logic
- **Environment Variables**: Access via centralized config, never direct process.env

## Error Handling
- **Standardized Format**: Use ApiError interface for all API responses
- **Server Errors**: Catch and log errors with request IDs in Server Actions
- **Client Errors**: Display via sonner toast notifications in bottom-left
- **Validation**: Validate input on server-side, never trust client data

## Database & Data
- **ORM Only**: Use Prisma/Drizzle, never raw SQL queries
- **Server-Side**: All database operations in Server Actions/API Routes
- **Arquero**: Use for in-memory data processing and mathematical operations
- **Deduplication**: Handle during CSV ingestion process

## Testing Requirements
- **From First Commit**: Implement Jest + Playwright tests immediately
- **Test Naming**: Descriptive test names following AAA pattern
- **E2E Tests**: Use Playwright for full user journey testing
- **Coverage**: Maintain meaningful test coverage, focus on critical paths

## UI/UX Standards
- **Geist Font**: Use Geist typography throughout
- **Theming**: Implement dark/light/system modes via tweakcn
- **Toast Position**: All notifications in bottom-left via sonner
- **Responsive**: Mobile-first responsive design
- **Accessibility**: Follow basic WCAG guidelines