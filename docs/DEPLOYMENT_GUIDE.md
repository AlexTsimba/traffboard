# Traffboard Deployment Guide
*Minimal GitHub → DigitalOcean Setup (65 minutes total)*

## 🚀 **MINIMAL DEPLOYMENT PLAN**

### **Phase 1: Repo Fixes** (30 min)
- [x] Fix file upload system (memory-based processing)
- [x] Remove hardcoded localhost URLs  
- [x] Clean temp directory
- [x] Create environment configuration

### **Phase 2: GitHub CI/CD** (15 min)
- [x] Single workflow: lint → typecheck → build → deploy
- [x] Auto-deploy on push to main
- [x] No staging environment (direct production)

### **Phase 3: DigitalOcean** (20 min)
- [x] Create managed PostgreSQL
- [x] Create App Platform application
- [x] Configure environment variables
- [x] Deploy and validate

## 🚨 Critical Issues Fixed

### File Upload System
- **Problem**: Saved CSV files to `/tmp/uploads` (fails on containers)
- **Solution**: Process CSV entirely in memory
- **Files**: `upload/route.ts`, `process/route.ts`, `ImportJob` schema

### Auth URLs
- **Problem**: Hardcoded `localhost:3000`
- **Solution**: Environment-based URLs only
- **Files**: `auth-client.ts`, `auth.ts`

## 📋 Quick Setup Steps

### **Step 1: Create DigitalOcean Resources**
```bash
# 1. Managed PostgreSQL (via DO Control Panel)
#    Databases → Create → PostgreSQL → Basic plan
#    Save connection string

# 2. App Platform (via DO Control Panel)  
#    Apps → Create → GitHub → your-repo → main branch
#    Build: npm run build
#    Run: npm start
```

### **Step 2: Set Environment Variables**
```env
# In DO App Platform → Settings → Environment:
BETTER_AUTH_URL=https://your-app.ondigitalocean.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.ondigitalocean.app
BETTER_AUTH_SECRET=your-32-char-secret
DATABASE_URL=your-postgres-connection-string
```

### **Step 3: Deploy & Setup Database**
```bash
# In DO App Platform console:
npx prisma migrate deploy

# Create admin user manually in database
```

### **Step 4: Validate**
- [ ] App loads
- [ ] Auth works
- [ ] CSV upload works
- [ ] Admin access works

## 🏗️ **MINIMAL ARCHITECTURE**

### **File Processing** (Fixed)
- **Before**: Saved files to `/tmp/uploads` ❌
- **Now**: Process CSV entirely in memory ✅
- **Database**: CSV content stored in `ImportJob.csvContent` field

### **CI/CD** (Fixed Environment Matching)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: {push: {branches: [main]}}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - uses: digitalocean/app_action/deploy@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
```

### **Environment Variables**
```env
# Required (set in DO App Platform)
NODE_ENV=production
BETTER_AUTH_URL=https://your-app.ondigitalocean.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.ondigitalocean.app  
BETTER_AUTH_SECRET=32-char-random-string
DATABASE_URL=${db.DATABASE_URL}  # DO managed database auto-injected
```

### **Database Connection Validation**
```bash
# DO App Platform auto-provides these variables:
# ${db.DATABASE_URL} - Full connection string
# ${db.HOSTNAME} - Database host
# ${db.PORT} - Database port
# ${db.USERNAME} - Database user
# ${db.PASSWORD} - Database password
# ${db.DATABASE} - Database name
```

## 🔍 **QUICK TROUBLESHOOTING**

### **Common Issues**
- **Build fails**: Check GitHub Actions logs
- **App won't start**: Verify environment variables in DO
- **Auth broken**: Check BETTER_AUTH_URL matches your DO app URL
- **CSV upload fails**: Check DO App Platform runtime logs
- **Database errors**: Verify DATABASE_URL and run `prisma migrate deploy`

### **Quick Commands**
```bash
# View DO logs: Control Panel → Apps → Runtime Logs
# Redeploy: Control Panel → Apps → Settings → Force Deploy
# Database: npx prisma studio (with production DATABASE_URL)
```

## 📋 **FINAL CHECKLIST**
- [ ] Repo fixes applied ✅
- [ ] GitHub Actions workflow added ✅  
- [ ] DO PostgreSQL created ✅
- [ ] DO App Platform created ✅
- [ ] Environment variables set ✅
- [ ] Database migrated ✅
- [ ] Admin user created ✅
- [ ] App accessible at DO URL ✅

---
*Total setup time: ~65 minutes | Minimal viable production deployment*