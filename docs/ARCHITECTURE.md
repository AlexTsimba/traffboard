# TraffBoard System Architecture

## 🎯 Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js v5 with role-based access
- **UI**: shadcn/ui + Tailwind CSS + Recharts
- **State**: Zustand stores with persistence
- **Testing**: Vitest + React Testing Library + Real PostgreSQL

## 🏗️ Application Structure

### Frontend Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── admin/             # Admin interface
│   └── reports/           # Report pages
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── auth/              # Authentication components
│   ├── admin/             # Admin management UI
│   └── reports/           # Report Factory components
├── lib/
│   ├── auth/              # Authentication logic
│   ├── data/              # Database access layer
│   └── reports/           # Report Factory system
└── stores/                # Zustand state management
```

### Report Factory Modular Design

```
src/lib/reports/
├── data-pipeline.ts       # Main orchestrator
├── pipeline/              # Modular components
│   ├── data-extractors.ts # Source data extraction
│   ├── data-transformers.ts # Business logic processing
│   ├── filter-utils.ts   # Filter building utilities
│   ├── cache-manager.ts  # Caching strategies
│   ├── pipeline-factory.ts # Pipeline creation & validation
│   └── transform-builder.ts # Builder pattern for transforms
├── export/               # Multi-format exports
└── plugin-system.ts     # Plugin registry & management
```

## 🔄 Data Flow Patterns

### Server Action Pattern

```typescript
// Server Action (src/lib/data/)
export async function getReportData(filters: FilterState) {
  const { user } = await requireAuth();

  const data = await prisma.playerData.findMany({
    where: buildWhereClause(filters, user.permissions),
    // ... optimized query
  });

  return processReportData(data, filters);
}

// Component Usage
async function ReportPage() {
  const data = await getReportData(filters);
  return <ReportTable data={data} />;
}
```

### Pipeline Processing Strategy

1. **PostgreSQL**: Heavy filtering, basic aggregations
2. **Arquero**: Business logic, dynamic calculations
3. **React**: UI rendering, interactions
4. **Cache**: Multi-layer caching (query → computation → UI)

## 🔐 Security Architecture

### Authentication Flow

- **NextAuth.js v5** with custom providers
- **Role-based access control** (admin, analyst, viewer)
- **Route protection** via middleware
- **API security** through server actions only

### Data Access Layer (DAL)

```typescript
// Secure data access pattern
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return { user: session.user };
}

// All data access goes through requireAuth()
export async function getPlayerData(filters: FilterState) {
  const { user } = await requireAuth();
  // Role-based filtering applied automatically
}
```

## 📊 Database Design

### Core Tables

- **PlayerData**: Main analytics table (millions of rows)
- **User**: Authentication and role management
- **Partner**: Partner metadata and configurations
- **SavedReports**: Persistent report configurations

### Performance Optimizations

- **Composite indexes** for common query patterns
- **Partial indexes** for filtered data
- **Connection pooling** via Prisma
- **Query optimization** through PostgreSQL-first approach

## 🧪 Testing Strategy

### Test Architecture

- **Unit Tests**: Individual components and utilities
- **Integration Tests**: Database operations and API flows
- **E2E Tests**: Complete user workflows
- **Performance Tests**: Large dataset handling

### Quality Gates

1. **TypeScript** strict mode compilation
2. **ESLint** + Prettier formatting
3. **Vitest** test suite (87+ tests)
4. **Real PostgreSQL** for integration testing

## 🚀 Deployment & Performance

### Optimization Techniques

- **Server Components** for data-heavy operations
- **Streaming** for progressive loading
- **Caching** at multiple layers
- **Code splitting** for optimal bundle sizes

### Scalability Considerations

- **Modular architecture** for team scaling
- **Plugin system** for feature extensions
- **Database optimization** for data growth
- **Caching strategies** for performance scaling
