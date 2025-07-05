---
title: "Backup & Disaster Recovery Strategy"
description: "Comprehensive backup strategy for TraffBoard deployment on DigitalOcean"
type: "how-to"
audience: ["devops", "architect", "frontend-dev"]
tags: ["backup", "disaster-recovery", "digitalocean", "operations"]
---

# 🔄 Backup & Disaster Recovery Strategy

Backup strategy for TraffBoard deployed on DigitalOcean App Platform.

## Backup Components

TraffBoard backup covers:

- **Application Code**: Git repository
- **Database**: PostgreSQL data (when implemented)
- **Static Assets**: Images, files
- **Configuration**: Environment variables

## Automated Backups

### Git Repository

- **Primary**: GitHub repository
- **Frequency**: Real-time on push
- **Retention**: Unlimited

### Database (Future)

```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > "backup_$DATE.sql.gz"
```

### DigitalOcean App Platform

- **Automatic**: Platform-level backups
- **Frequency**: Daily snapshots
- **Retention**: 7 days
- **Access**: DigitalOcean dashboard

## Manual Backup Procedures

### Quick Backup

```bash
# Clone repository
git clone https://github.com/AlexTsimba/traffboard.git backup_repo

# Export environment variables
doctl apps list
doctl apps get <app-id> --format json > app_config.json
```

### Full Environment Backup

```bash
# Create backup directory
mkdir traffboard_backup_$(date +%Y%m%d)
cd traffboard_backup_$(date +%Y%m%d)

# Repository backup
git clone --mirror https://github.com/AlexTsimba/traffboard.git repo.git

# Configuration backup
doctl apps get <app-id> > app_config.yaml
```

## Disaster Recovery

### Scenario 1: App Platform Failure

1. **Create new DigitalOcean app**
2. **Deploy from GitHub**: Connect repository
3. **Restore environment variables**: From backup
4. **Verify deployment**: Run health checks

### Scenario 2: Repository Loss

1. **Use backup repository clone**
2. **Create new GitHub repository**
3. **Push backup code**
4. **Reconnect DigitalOcean app**

### Scenario 3: Data Loss (Future)

1. **Restore database**: From latest backup
2. **Verify data integrity**: Run checks
3. **Update app configuration**: If needed

## Recovery Time Objectives

| Component         | RTO    | RPO    | Method     |
| ----------------- | ------ | ------ | ---------- |
| **Application**   | 15 min | 0      | Git deploy |
| **Database**      | 30 min | 24 hrs | pg_restore |
| **Configuration** | 5 min  | Manual | doctl      |

## Backup Schedule

```
Daily:    Database backup (when implemented)
Weekly:   Full configuration export
Monthly:  Complete environment documentation
```

## Monitoring

### Health Checks

```bash
# App status
curl https://your-app.ondigitalocean.app/api/health

# Database status (future)
pg_isready -d $DATABASE_URL
```

### Backup Verification

```bash
# Verify Git backup
git clone backup_repo test_restore
cd test_restore && pnpm install && pnpm build

# Verify database backup (future)
pg_restore --list backup.sql
```

## Emergency Contacts

- **DigitalOcean Support**: Submit ticket
- **GitHub Support**: support@github.com
- **Team Lead**: [Contact info]

---

**Last Updated**: Check git log for recent changes

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

### Backup Monitoring Workflow

```yaml
# .github/workflows/backup-monitor.yml
name: 🔍 Backup Monitoring
on:
  schedule:
    - cron: "0 6 * * *" # Daily at 6 AM UTC

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
```

### Validation Checklist

- [ ] Backup files are created successfully
- [ ] Encrypted backups can be decrypted
- [ ] Recovery procedures work end-to-end
- [ ] Monitoring alerts fire correctly
- [ ] Access controls are properly configured
- [ ] Retention policies are enforced

## 🔧 Setup Instructions

### Initial Configuration

1. **Set up DigitalOcean Spaces**

   ```bash
   # Configure s3cmd
   s3cmd --configure

   # Create backup bucket
   s3cmd mb s3://traffboard-backups
   ```

2. **Configure GitHub Actions secrets**

   - `DO_API_TOKEN`: DigitalOcean API token
   - `SPACES_ACCESS_KEY`: DigitalOcean Spaces access key
   - `SPACES_SECRET_KEY`: DigitalOcean Spaces secret key

3. **Install backup scripts**

   ```bash
   # Make scripts executable
   chmod +x scripts/backup-*.sh

   # Test backup scripts
   ./scripts/test-backup-restore.sh
   ```

### Automated Setup

Run the setup script to configure all backup components:

```bash
# Run backup setup
./scripts/setup-backup.sh

# Verify configuration
./scripts/verify-backup-config.sh
```

---

## Related Documentation

- **[Deployment Guide](./deployment.md)** - Production deployment procedures
- **[Monitoring Setup](./monitoring.md)** - Application monitoring and alerting
- **[Security Configuration](./security.md)** - Security settings and best practices

---

**Navigation:** [← Operations Hub](../README.md) | [How-To Home](../../README.md) | [Deployment Guide →](./deployment.md)
