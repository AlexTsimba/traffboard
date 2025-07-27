# Traffboard Deployment Guide
*GitHub → DigitalOcean App Platform*

## 🚨 Critical Issues Fixed Before Deployment

### File Upload System
- **Problem**: Original system saved CSV files to `/tmp/uploads` which fails on DO App Platform containers
- **Solution**: Refactored to process CSV uploads in memory without file system operations
- **Files Modified**: `src/app/api/admin/data/upload/route.ts`, `src/app/api/admin/data/process/route.ts`

### Hardcoded URLs
- **Problem**: Auth system defaulted to `localhost:3000`
- **Solution**: Requires environment variables for production URLs
- **Files Fixed**: `src/lib/auth-client.ts`, `src/lib/auth.ts`

## 📋 Deployment Steps

### Phase 1: DigitalOcean Setup

#### 1. Create Managed PostgreSQL Database
```bash
# Via DO Control Panel:
# Databases → Create → PostgreSQL
# Choose region, size, version 15+
# Save connection string for later
```

#### 2. Create App Platform Application
```bash
# Via DO Control Panel:
# Apps → Create App → GitHub
# Repository: your-username/traffboard
# Branch: main
# Build Command: npm run build
# Run Command: npm start
```

#### 3. Configure Environment Variables
Set these in DO App Platform → Settings → Environment:

```env
# Required - App URLs (replace with your actual DO app URL)
BETTER_AUTH_URL=https://your-app-name.ondigitalocean.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app-name.ondigitalocean.app

# Required - Auth Secret (generate 32+ character random string)
BETTER_AUTH_SECRET=your-32-character-random-secret-here

# Required - Database (use your DO PostgreSQL connection string)
DATABASE_URL=postgresql://username:password@host:port/database

# Optional - OAuth (if using Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Phase 2: Database Setup

#### 1. Deploy Database Schema
```bash
# After first deployment, run via DO App Platform console:
npx prisma migrate deploy
```

#### 2. Create Admin User
```bash
# Via DO App Platform console or locally with production DATABASE_URL:
npx prisma studio
# Or create via database directly
```

### Phase 3: Validation

#### Test These Features:
- [ ] App loads at DO URL
- [ ] Database connection works  
- [ ] User authentication works
- [ ] Admin dashboard accessible
- [ ] CSV upload and processing works
- [ ] Data import to database works

## 🏗️ Architecture Notes

### File Processing
- **Development**: Files temporarily saved to `./temp/uploads/`
- **Production**: Files processed entirely in memory
- **Database**: Import jobs tracked in `ImportJob` table
- **Cleanup**: No temporary files created in production

### Environment Detection
```typescript
const isProduction = process.env.NODE_ENV === 'production'
// Production: Memory-based processing
// Development: File-based processing with temp directory
```

### Security
- Admin-only access for data management
- File upload restricted to CSV, max 50MB
- Input validation and sanitization
- Environment-based configuration

## 🔧 Build Configuration

### Excluded from Production Build
- `/temp/` directory
- `/docs/` directory  
- `/tests/` directory
- `/screenshots/` directory
- Development scripts and logs

### Required Dependencies
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
- Runs on push to `main` branch
- Executes: lint, typecheck, tests
- Deploys to DO App Platform on success
- Environment variables managed via DO platform

### Manual Deployment
```bash
# Via DO Control Panel:
# Apps → Your App → Settings → Trigger Deploy
```

## 🔍 Troubleshooting

### Common Issues

**Environment Variables Missing**
```bash
# Check DO App Platform → Settings → Environment
# Ensure all required variables are set
```

**Database Connection Failed** 
```bash
# Verify DATABASE_URL format
# Check DO database is running and accessible
```

**CSV Upload Not Working**
```bash
# Check browser console for errors
# Verify admin authentication
# Check DO App Platform logs
```

**Build Failures**
```bash
# Check DO App Platform build logs
# Verify package.json dependencies
# Ensure Node.js version compatibility
```

### Logs and Debugging
```bash
# View application logs:
# DO Control Panel → Apps → Your App → Runtime Logs

# View build logs:
# DO Control Panel → Apps → Your App → Build Logs
```

## 📊 Database Schema

### Key Tables
- `User` - Authentication and admin access
- `TrafficReport` - CSV import data (19 columns)
- `PlayersData` - CSV import data (35 columns) 
- `ImportJob` - Track CSV processing status

### CSV Import Schema
- **Traffic Report**: 19 columns, auto-detected by headers
- **Players Data**: 35 columns, auto-detected by headers
- **Validation**: Type checking, required fields, duplicates handling

## 🔐 Security Considerations

### Production Checklist
- [ ] `BETTER_AUTH_SECRET` is cryptographically secure (32+ chars)
- [ ] Database credentials are secure
- [ ] No hardcoded secrets in code
- [ ] CORS configured for production domain
- [ ] Admin access properly restricted
- [ ] OAuth credentials (if used) properly configured

### Admin User Creation
```sql
-- Manual admin creation via database:
INSERT INTO "user" (id, name, email, role, "emailVerified", password)
VALUES (
  'admin-id',
  'Admin User', 
  'admin@yourcompany.com',
  'admin',
  true,
  -- Hash password using bcryptjs with salt rounds 12
  '$2a$12$hashedpasswordhere'
);
```

---

*This deployment guide covers the complete setup for Traffboard on DigitalOcean App Platform with managed PostgreSQL database.*