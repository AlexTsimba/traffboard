# 🔐 Secrets Management Guide

This document outlines how to manage sensitive data and environment variables in the TraffBoard project using GitHub Actions secrets.

## 📋 Overview

TraffBoard uses GitHub Actions secrets to securely store and access sensitive information like API keys, database URLs, and other credentials during CI/CD processes.

## 🔑 Required Secrets

### Production Secrets (Required for DigitalOcean deployment)

| Secret Name | Description | Example Value | Required For |
|-------------|-------------|---------------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Production deployment |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | `your-secret-key-here` | Authentication |
| `NEXTAUTH_URL` | Production URL | `https://traffboard.yourdomain.com` | Authentication |
| `DO_APP_ID` | DigitalOcean App Platform ID | `your-app-id` | Deployment |
| `DO_API_TOKEN` | DigitalOcean API token | `dop_v1_...` | Deployment |

### Optional API Secrets (Add as needed)

| Secret Name | Description | When to Add |
|-------------|-------------|-------------|
| `OPENAI_API_KEY` | OpenAI API key | If using AI features |
| `STRIPE_SECRET_KEY` | Stripe payment processing | If adding payments |
| `SENTRY_DSN` | Error tracking with Sentry | If using error monitoring |
| `ANALYTICS_API_KEY` | Analytics service API key | If using external analytics |

## 🛠️ Setting Up Secrets

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**

### 2. Add Repository Secrets

Click **New repository secret** and add each required secret:

```bash
# Example: Adding DATABASE_URL
Name: DATABASE_URL
Secret: postgresql://username:password@localhost:5432/traffboard_prod
```

### 3. Environment-Specific Secrets

For different environments (development, staging, production), use GitHub Environments:

- **development**: `DATABASE_URL_DEV`
- **staging**: `DATABASE_URL_STAGING`  
- **production**: `DATABASE_URL_PROD`

## 🔧 Using Secrets in Workflows

### Basic Usage

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to DigitalOcean
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          DO_API_TOKEN: ${{ secrets.DO_API_TOKEN }}
        run: |
          # Your deployment commands here
          echo "Deploying with secured environment variables"
```

### Environment-Specific Deployment

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Production Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL_PROD }}
        run: |
          # Production deployment
```

## 🔒 Security Best Practices

### 1. Secret Rotation

- **Regular Rotation**: Rotate secrets every 90 days
- **Immediate Rotation**: If secret is compromised
- **Automated Alerts**: Set up monitoring for secret usage

### 2. Principle of Least Privilege

- Only add secrets that are actually needed
- Use environment-specific secrets when possible
- Regularly audit secret usage

### 3. Secret Validation

```yaml
- name: Validate Secrets
  run: |
    if [ -z "${{ secrets.DATABASE_URL }}" ]; then
      echo "ERROR: DATABASE_URL secret is not set"
      exit 1
    fi
    echo "✅ All required secrets are present"
```

## 📊 Monitoring Secret Usage

### 1. Audit Log

GitHub provides audit logs for secret access:
- Repository Settings → Audit log
- Filter by "secret" actions

### 2. Workflow Monitoring

```yaml
- name: Log Secret Usage (Safe)
  run: |
    echo "Using DATABASE_URL: ${DATABASE_URL:0:10}***"
    echo "Using API keys: $(echo $API_KEY | wc -c) characters"
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
```

## 🚨 Emergency Procedures

### If Secret is Compromised

1. **Immediate Actions**:
   ```bash
   # 1. Revoke the compromised secret immediately
   # 2. Update the secret in GitHub repository settings
   # 3. Redeploy affected services
   ```

2. **Investigation**:
   - Check audit logs for unauthorized access
   - Review recent workflow runs
   - Scan for potential data exposure

3. **Recovery**:
   - Generate new secret/API key
   - Update all dependent services
   - Verify system integrity

## 🔄 DigitalOcean Integration

### App Platform Environment Variables

```bash
# Set these in DigitalOcean App Platform settings:
DATABASE_URL=${DATABASE_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL}
NODE_ENV=production
```

### Deployment Workflow

```yaml
- name: Deploy to DigitalOcean
  uses: digitalocean/app_action@v1
  with:
    app_name: traffboard
    token: ${{ secrets.DO_API_TOKEN }}
    app_spec_location: .do/app.yaml
```

## 📚 Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [DigitalOcean App Platform Environment Variables](https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)

## ✅ Checklist

- [ ] Add all required production secrets
- [ ] Set up environment-specific secrets if needed
- [ ] Configure DigitalOcean App Platform environment variables
- [ ] Test secret access in staging environment
- [ ] Document secret rotation schedule
- [ ] Set up monitoring and alerts 