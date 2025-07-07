# TraffBoard Quick Start

## 🚀 Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- pnpm 8+

### Installation
```bash
# Clone and install
git clone <repo>
cd TraffBoard_old
pnpm install

# Database setup
cp .env.example .env.local
# Edit .env.local with your database credentials

# Initialize database
pnpm db:push
pnpm db:seed

# Start development
pnpm dev
```

## 🔧 Common Commands

### Development
```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server

# Database
pnpm db:push      # Push schema changes
pnpm db:reset     # Reset database
pnpm db:seed      # Seed demo data
pnpm db:studio    # Open Prisma Studio

# Quality
pnpm lint         # ESLint check
pnpm lint:fix     # Auto-fix lint issues
pnpm type-check   # TypeScript validation
pnpm test         # Run test suite
pnpm test:watch   # Watch mode testing
```

### Code Generation
```bash
pnpm db:generate  # Generate Prisma client
pnpm ui:add <component>  # Add shadcn/ui component
```

## 🏗️ Project Structure

### Key Directories
```
src/
├── app/                 # Next.js pages (App Router)
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives
│   ├── auth/           # Authentication components  
│   ├── admin/          # Admin interface
│   └── reports/        # Report Factory components
├── lib/                # Core utilities
│   ├── auth/           # Authentication logic
│   ├── data/           # Database access layer
│   └── reports/        # Report Factory system
└── stores/             # Zustand state management
```

### Important Files
- `auth.config.ts` - NextAuth.js configuration
- `prisma/schema.prisma` - Database schema
- `middleware.ts` - Route protection
- `vitest.config.ts` - Test configuration

## 🧭 Development Workflow

### Feature Development
1. **Create branch**: `git checkout -b feature/task-name`
2. **Write tests first**: Create failing tests for new functionality
3. **Implement feature**: Make tests pass
4. **Quality checks**: `pnpm lint && pnpm type-check && pnpm test`
5. **Commit**: `git commit -m "feat: descriptive message"`
6. **Push**: `git push origin feature/task-name`

### Testing Strategy
```bash
# Unit tests for utilities
src/lib/__tests__/

# Component tests  
src/components/__tests__/

# Integration tests
src/__tests__/

# E2E tests
tests/e2e/
```

## 🔑 Authentication

### Default Users (after seeding)
- **Admin**: `admin@traffboard.com` / `admin123`
- **Analyst**: `analyst@traffboard.com` / `analyst123`

### Roles & Permissions
- **Admin**: Full system access, user management
- **Analyst**: Report access, limited admin features
- **Viewer**: Read-only report access

## 📊 Data Management

### CSV Import
1. Navigate to `/admin/data-management`
2. Upload CSV files (players, traffic, conversions)
3. Map columns to schema fields
4. Process and validate data

### Demo Data
Use seeded demo data for development:
- **Partners**: Demo partners with realistic data
- **Players**: 1000+ sample player records  
- **Traffic**: Sample traffic conversion data

## 🧪 Testing

### Test Commands
```bash
pnpm test                    # Full test suite
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests only
pnpm test:e2e              # End-to-end tests
pnpm test:coverage         # Test coverage report
```

### Writing Tests
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import Component from './Component';

test('renders correctly', () => {
  render(<Component />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});

// Integration test example  
test('database operation', async () => {
  const result = await createUser({ email: 'test@test.com' });
  expect(result.email).toBe('test@test.com');
});
```

## 🚨 Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
pnpm db:reset
```

**Build errors**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
pnpm install
pnpm build
```

**Test failures**
```bash
# Run single test file
pnpm test src/path/to/test.test.ts

# Debug mode
pnpm test --reporter=verbose
```

**Type errors**
```bash
# Regenerate Prisma client
pnpm db:generate

# Check TypeScript strictly
pnpm type-check
```

### Environment Issues
- Ensure `.env.local` has all required variables
- Check Node.js version compatibility (18+)
- Verify PostgreSQL version (14+)
- Clear browser cache for auth issues

## 📚 Next Steps

1. **Explore codebase**: Start with `src/app/page.tsx`
2. **Run tests**: Understand test patterns
3. **Check admin**: Visit `/admin` with admin credentials
4. **Review architecture**: Read `docs/ARCHITECTURE.md`
5. **Start developing**: Pick a task and follow TDD workflow 