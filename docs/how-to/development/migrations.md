---
title: Database Migrations Guide
description: How to manage database schema changes with Drizzle ORM
category: Development
tags: [database, migrations, drizzle, postgresql]
last_updated: 2025-07-02
---

# Database Migrations Guide

This guide covers how to safely manage database schema changes using Drizzle ORM in the TraffBoard project.

## Overview

We use [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) for database migrations with PostgreSQL. The migration system ensures safe, versioned schema changes across development, staging, and production environments.

## Setup

### Configuration

Migration configuration is defined in `drizzle.config.ts`:

```typescript
export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/traffboard_dev',
  },
  verbose: process.env.NODE_ENV === 'development',
  strict: true,
  migrations: {
    prefix: 'timestamp',
    table: 'migrations',
    schema: 'public',
  },
});
```

### Environment Variables

Required environment variables for different environments:

```bash
# Development (.env.local)
DATABASE_URL=postgresql://localhost:5432/traffboard_dev

# Testing (.env.test)  
DATABASE_URL=postgresql://localhost:5432/traffboard_test

# Production (server environment)
DATABASE_URL=postgresql://user:password@host:port/database
```

## Available Commands

### Core Migration Commands

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push

# Open Drizzle Studio GUI
pnpm db:studio

# Drop all migrations (DANGER)
pnpm db:drop
```

### Command Details

#### `pnpm db:generate`
- Compares current schema with database state
- Generates SQL migration files in `src/db/migrations/`
- Creates metadata in `meta/_journal.json`
- Safe to run multiple times

#### `pnpm db:migrate`
- Applies pending migrations to database
- Updates migration tracking table
- Should be used in production deployments

#### `pnpm db:push`
- Directly pushes schema to database without migrations
- **Development only** - bypasses migration history
- Useful for rapid prototyping

#### `pnpm db:studio`
- Launches web-based database browser
- View and edit data through GUI
- Automatically connects using `DATABASE_URL`

## Workflow

### 1. Making Schema Changes

1. **Edit schema files** in `src/db/schema/`
2. **Generate migration**: `pnpm db:generate`
3. **Review generated SQL** in `src/db/migrations/`
4. **Test migration** locally: `pnpm db:migrate`
5. **Commit migration files** to git

### 2. Local Development

```bash
# Start with clean database
pnpm db:migrate

# Make schema changes in src/db/schema/
# Generate new migration
pnpm db:generate

# Apply migration locally
pnpm db:migrate

# Verify changes in Drizzle Studio
pnpm db:studio
```

### 3. Team Collaboration

1. **Pull latest migrations** from git
2. **Apply new migrations**: `pnpm db:migrate`
3. **Continue development** with synced schema

### 4. Production Deployment

1. **Backup database** before deployment
2. **Apply migrations**: `pnpm db:migrate`
3. **Deploy application** code
4. **Verify deployment** success

## Migration Safety

### Pre-Deployment Checklist

- [ ] Database backup completed
- [ ] Migration tested in staging environment
- [ ] Rollback plan prepared
- [ ] Team notified of deployment window
- [ ] Downtime expectations communicated

### Rollback Strategy

For each migration, we maintain `.down.sql` files for rollback:

```bash
# Manual rollback (if needed)
psql $DATABASE_URL -f src/db/migrations/TIMESTAMP_migration_name.down.sql
```

⚠️ **Warning**: Rollbacks may cause data loss. Always backup before proceeding.

### Dangerous Operations

These operations require extra caution:

- **Dropping columns**: Data will be permanently lost
- **Changing column types**: May fail if data incompatible  
- **Adding NOT NULL constraints**: Requires default values or data migration
- **Dropping tables**: All data permanently deleted

## Best Practices

### Schema Design

- **Use descriptive names** for tables and columns
- **Add comments** for complex business logic
- **Consider nullable vs NOT NULL** carefully
- **Use appropriate data types** (avoid TEXT for everything)

### Migration Development

- **Small, atomic changes** - one logical change per migration
- **Test thoroughly** in development before committing
- **Review generated SQL** - don't blindly trust automation
- **Add data migrations** when needed for complex changes

### Team Workflow

- **Coordinate schema changes** - avoid conflicts
- **Communicate breaking changes** early
- **Use feature branches** for experimental schemas
- **Review migration PRs** carefully

## Troubleshooting

### Common Issues

#### "No schema changes, nothing to migrate"
- Schema already matches database state
- Check if you saved schema files
- Verify schema syntax is correct

#### Migration fails during apply
- Check database connection
- Verify user permissions
- Review SQL for syntax errors
- Check for data conflicts

#### Migration conflicts
- Occurs when multiple developers change schema
- Resolve by rebasing migrations
- May require manual conflict resolution

### Recovery Procedures

#### Failed Migration
1. **Don't panic** - most issues are recoverable
2. **Check error message** for specific issue
3. **Backup current state** before attempting fixes
4. **Fix underlying issue** (data, permissions, etc.)
5. **Re-run migration** or apply rollback

#### Corrupted Migration State
1. **Backup database** immediately
2. **Check migration table** state
3. **Manually fix tracking** if needed
4. **Re-sync with correct state**

## Environment-Specific Notes

### Development
- Use `db:push` for rapid iteration
- Regular `db:generate` for proper migrations
- Keep local database in sync with team

### Testing
- Use separate test database
- Reset schema between test runs
- Consider in-memory database for unit tests

### Production
- **Always backup** before migrations
- **Test in staging** first
- **Monitor during deployment**
- **Have rollback plan** ready

## Security Considerations

### Database Access
- Use least-privilege database users
- Rotate credentials regularly
- Monitor database access logs
- Encrypt connections (SSL/TLS)

### Migration Security
- Review migration SQL for injection risks
- Validate schema changes for security impact
- Test with real-world data volumes
- Monitor performance impact

## Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Migrations](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Migration Best Practices](https://docs.github.com/en/repositories/working-with-files/managing-files/viewing-a-file#viewing-the-file-history) 