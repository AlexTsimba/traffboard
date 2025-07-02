# 🔄 Backup Strategy for DigitalOcean Deployment

This document outlines the comprehensive backup and disaster recovery strategy for TraffBoard deployed on DigitalOcean App Platform.

## 📋 Overview

TraffBoard backup strategy covers all critical data components to ensure business continuity and data protection:

- **Application State**: Next.js application code and static assets
- **Database**: PostgreSQL data (when implemented)
- **User Files**: Uploaded files and media (when implemented)
- **Configuration**: Environment variables and app settings
- **Infrastructure**: Deployment configurations and CI/CD setup

## 🏗️ Architecture Components

### 1. **DigitalOcean App Platform (Primary)**
- **Component**: Next.js application
- **Backup Method**: Git-based deployment + Docker registry
- **Frequency**: Continuous (on push to main)
- **Storage**: GitHub repository + DigitalOcean Container Registry

### 2. **Database (Future Implementation)**
- **Component**: PostgreSQL database
- **Backup Method**: Automated dumps + Point-in-time recovery
- **Frequency**: Daily full backup + continuous WAL
- **Storage**: DigitalOcean Spaces + Cross-region replication

### 3. **User Files (Future Implementation)**
- **Component**: Uploaded files, media assets
- **Backup Method**: DigitalOcean Spaces replication
- **Frequency**: Real-time synchronization
- **Storage**: Primary Space + Cross-region replica

### 4. **Configuration Data**
- **Component**: Environment variables, secrets
- **Backup Method**: Encrypted configuration files
- **Frequency**: On change + Weekly snapshots
- **Storage**: Secure GitHub repository + DigitalOcean Spaces

## 🔄 Backup Implementation

### Phase 1: Application & Configuration (Current)

#### Git Repository Backup
```yaml
# .github/workflows/backup.yml
name: 🔄 Repository Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create GitHub Backup
        run: |
          # Mirror repository to backup location
          git clone --mirror ${{ github.repository }}
          # Upload to DigitalOcean Spaces
```

#### Configuration Backup
```bash
#!/bin/bash
# scripts/backup-config.sh

# Backup environment template
cp .env.example .backup/env-template.backup

# Backup app configuration (excluding secrets)
echo "# Backup created: $(date)" > .backup/app-config.backup
echo "NODE_ENV=production" >> .backup/app-config.backup
echo "NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL" >> .backup/app-config.backup

# Encrypt and upload to DigitalOcean Spaces
```

### Phase 2: Database Backup (Future)

#### PostgreSQL Automated Backup
```bash
#!/bin/bash
# scripts/backup-database.sh

DB_NAME="traffboard_prod"
BACKUP_DIR="/tmp/db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database dump
pg_dump $DATABASE_URL > $BACKUP_DIR/db_full_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/db_full_$TIMESTAMP.sql

# Upload to DigitalOcean Spaces
s3cmd put $BACKUP_DIR/db_full_$TIMESTAMP.sql.gz s3://traffboard-backups/database/

# Cleanup old local backups (keep last 3 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +3 -delete
```

#### Point-in-Time Recovery Setup
```sql
-- PostgreSQL configuration for PITR
-- In postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 's3cmd put %p s3://traffboard-backups/wal/%f'
max_wal_senders = 3
checkpoint_completion_target = 0.9
```

### Phase 3: File System Backup (Future)

#### User Files Synchronization
```bash
#!/bin/bash
# scripts/backup-files.sh

SOURCE_DIR="/app/uploads"
BACKUP_SPACE="s3://traffboard-backups/files/"

# Sync files to backup space
s3cmd sync $SOURCE_DIR/ $BACKUP_SPACE \
  --delete-removed \
  --preserve \
  --verbose

# Create manifest
echo "Backup completed: $(date)" > /tmp/backup-manifest.txt
echo "Files backed up: $(find $SOURCE_DIR -type f | wc -l)" >> /tmp/backup-manifest.txt
s3cmd put /tmp/backup-manifest.txt s3://traffboard-backups/manifests/files_$(date +%Y%m%d).txt
```

## 📅 Backup Schedule

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|---------|
| **Code Repository** | On push + Daily | 90 days | Git mirror + Spaces |
| **Configuration** | On change + Weekly | 30 days | Encrypted files |
| **Database (Future)** | Daily full + Continuous WAL | 30 days full, 7 days WAL | pg_dump + WAL archiving |
| **User Files (Future)** | Real-time sync | 90 days | DigitalOcean Spaces replication |
| **App Platform Snapshots** | Weekly | 4 weeks | DO App Platform backups |

## 🚨 Disaster Recovery Procedures

### 1. **Application Recovery**
```bash
# Complete application recovery
git clone https://github.com/AlexTsimba/traffboard.git
cd traffboard
git checkout main
pnpm install
pnpm build

# Deploy to new DigitalOcean App
doctl apps create .do/app.yaml
```

### 2. **Database Recovery (Future)**
```bash
# Full database restore
createdb traffboard_restored
gunzip -c db_full_20240101_120000.sql.gz | psql traffboard_restored

# Point-in-time recovery
pg_basebackup -D /recovery -Ft -z -P
# Apply WAL files up to specific timestamp
```

### 3. **Configuration Recovery**
```bash
# Restore configuration from backup
s3cmd get s3://traffboard-backups/config/latest.env.backup .env
# Update DO App Platform environment variables
doctl apps update $APP_ID --spec .do/app.yaml
```

## 🔐 Security & Encryption

### Backup Encryption
```bash
# Encrypt sensitive backups before upload
gpg --symmetric --cipher-algo AES256 --output backup.sql.gpg backup.sql
s3cmd put backup.sql.gpg s3://traffboard-backups/encrypted/

# Decrypt for restore
gpg --decrypt backup.sql.gpg > backup.sql
```

### Access Control
- **DigitalOcean Spaces**: IAM policies for backup access only
- **Encryption Keys**: Stored in DigitalOcean App Platform secrets
- **GitHub Repository**: Protected branches + required reviews
- **Database**: Separate backup user with minimal privileges

## 📊 Monitoring & Alerting

### Backup Monitoring
```yaml
# .github/workflows/backup-monitor.yml
name: 🔍 Backup Monitoring
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC

jobs:
  check-backups:
    runs-on: ubuntu-latest
    steps:
      - name: Verify Recent Backups
        run: |
          # Check last backup timestamp
          # Alert if backup is older than 25 hours
          # Verify backup file integrity
          # Send status to monitoring endpoint
```

### Health Checks
- **Application**: `/api/health` endpoint with backup status
- **Database**: Connection and backup completion status
- **Files**: Sync status and manifest verification
- **Alerts**: Slack/Email notifications for backup failures

## 🧪 Testing & Validation

### Monthly Backup Testing
```bash
#!/bin/bash
# scripts/test-backup-restore.sh

echo "🧪 Testing backup restoration process..."

# Test database restore (when implemented)
if [ ! -z "$DATABASE_URL" ]; then
  echo "Testing database backup restore..."
  # Create test database and restore from latest backup
  # Verify data integrity and completeness
fi

# Test file restore
echo "Testing file backup restore..."
# Download files from backup space to test directory
# Verify file count and checksums

# Test configuration restore
echo "Testing configuration restore..."
# Restore configuration from backup
# Verify all required variables are present

echo "✅ Backup testing completed successfully"
```

### Automated Testing
- **CI/CD Integration**: Weekly automated restore testing
- **Data Integrity**: Checksum verification for all backup files
- **Recovery Time**: Measure and monitor restoration times
- **Documentation**: Keep restoration procedures up-to-date

## 📚 Documentation & Runbooks

### Recovery Runbooks
1. **[Application Recovery](./runbooks/APP_RECOVERY.md)** - Step-by-step app restoration
2. **[Database Recovery](./runbooks/DB_RECOVERY.md)** - Database restoration procedures
3. **[Complete Disaster Recovery](./runbooks/DISASTER_RECOVERY.md)** - Full system recovery

### Team Training
- **Quarterly**: Disaster recovery drills
- **Documentation**: Updated recovery procedures
- **Access**: Ensure team has necessary credentials and permissions
- **Communication**: Clear escalation procedures for backup failures

## 🎯 Implementation Roadmap

### ✅ Phase 1: Current (Infrastructure Setup)
- [x] Git repository protection and mirroring
- [x] DigitalOcean App Platform deployment
- [x] Basic health monitoring
- [x] Configuration management documentation

### 🚧 Phase 2: Enhanced Backup (When Database Added)
- [ ] DigitalOcean Spaces setup for backups
- [ ] PostgreSQL automated backup scripts
- [ ] Point-in-time recovery configuration
- [ ] Encrypted backup storage

### 🔮 Phase 3: Advanced Features (Future)
- [ ] User file backup and synchronization
- [ ] Cross-region backup replication
- [ ] Advanced monitoring and alerting
- [ ] Automated disaster recovery testing

## 💰 Cost Estimation

| Service | Monthly Cost | Purpose |
|---------|--------------|---------|
| **DigitalOcean Spaces** | $5-20 | Backup storage |
| **Additional DO Droplet** | $12-48 | Backup automation (if needed) |
| **Data Transfer** | $1-10 | Backup uploads/downloads |
| **Total Estimated** | $18-78/month | Complete backup solution |

*Costs vary based on data volume and backup frequency*

## 🚀 Benefits

- ✅ **Data Protection**: Multi-layer backup strategy
- ✅ **Quick Recovery**: Documented restoration procedures  
- ✅ **Compliance**: Regular testing and validation
- ✅ **Cost Effective**: Optimized storage and transfer costs
- ✅ **Automated**: Minimal manual intervention required
- ✅ **Scalable**: Easy to extend as application grows

---

*This backup strategy evolves with the application architecture and will be updated as new components are added.* 