# Vercel Cache Management Guide

This guide provides comprehensive solutions to stop Vercel from using prebuilt artifacts and ensure fresh deployments for your project.

## Table of Contents

1. [Overview](#overview)
2. [Method 1: Redeploy from Vercel Dashboard with Cleared Cache](#method-1-redeploy-from-vercel-dashboard-with-cleared-cache)
3. [Method 2: Using Vercel CLI to Force New Build](#method-2-using-vercel-cli-to-force-new-build)
4. [Method 3: Purging Data Cache for Next.js](#method-3-purging-data-cache-for-nextjs)
5. [Automated Scripts](#automated-scripts)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Overview

Vercel uses various caching mechanisms to optimize build times and deployment speed. However, sometimes you need to bypass these caches to ensure a completely fresh deployment. This can be necessary when:

- Build artifacts are corrupted or outdated
- Environment variables have changed
- Dependencies have been updated
- Code changes aren't being reflected in deployments
- Debugging deployment issues

## Method 1: Redeploy from Vercel Dashboard with Cleared Cache

### Step-by-Step Instructions

#### 1. Access Your Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in to your account
2. Navigate to your project dashboard
3. Select the specific project you want to redeploy

#### 2. Clear Build Cache

1. **Navigate to Settings**:
   - Click on the "Settings" tab in your project dashboard
   - Go to the "General" section

2. **Clear Build Cache**:
   - Scroll down to find the "Build & Development Settings" section
   - Look for "Build Cache" or "Clear Cache" option
   - Click "Clear Cache" or "Purge Cache"
   - Confirm the action when prompted

#### 3. Clear Function Cache (if applicable)

1. In the same Settings section, look for "Functions" or "Serverless Functions"
2. Find the cache clearing option for functions
3. Click to clear function cache

#### 4. Trigger Fresh Deployment

**Option A: Redeploy Latest Deployment**
1. Go to the "Deployments" tab
2. Find your latest deployment
3. Click the three dots menu (⋯) next to the deployment
4. Select "Redeploy"
5. Ensure "Use existing Build Cache" is **unchecked**
6. Click "Redeploy"

**Option B: Deploy from Git**
1. Go to the "Deployments" tab
2. Click "Deploy" or "Create Deployment"
3. Select your Git branch (usually `main` or `master`)
4. Ensure build cache options are disabled
5. Click "Deploy"

#### 5. Monitor Deployment

1. Watch the deployment logs in real-time
2. Verify that the build process starts from scratch
3. Check for any errors or warnings
4. Test the deployed application once complete

### Dashboard Cache Types

- **Build Cache**: Caches build outputs and dependencies
- **Function Cache**: Caches serverless function builds
- **Edge Cache**: Caches static assets and API responses
- **Data Cache**: Caches Next.js data fetching results

## Method 2: Using Vercel CLI to Force New Build

### Prerequisites

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link Your Project** (if not already linked):
   ```bash
   vercel link
   ```

### Force Deployment Commands

#### Basic Force Deployment

```bash
# Force deploy to preview
vercel deploy --force

# Force deploy to production
vercel deploy --prod --force
```

#### Advanced Force Deployment with Cache Clearing

```bash
# Clear local cache and force deploy
rm -rf .vercel .next node_modules/.cache
npm install
vercel deploy --prod --force
```

### Using the Provided Script

We've created a convenient script for force deployment:

```bash
# Make the script executable
chmod +x scripts/force-deploy.sh

# Run force deployment to production
./scripts/force-deploy.sh --env production

# Run with cache clearing
./scripts/force-deploy.sh --env production --clear-cache

# Run with validation
./scripts/force-deploy.sh --env production --validate
```

### Script Options

- `--env`: Target environment (preview/production)
- `--clear-cache`: Clear local caches before deployment
- `--validate`: Run pre-deployment validation
- `--help`: Show help information

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Force Deploy to Vercel

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production
      clear_cache:
        description: 'Clear cache before deployment'
        required: false
        default: true
        type: boolean

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Clear cache (if requested)
        if: ${{ github.event.inputs.clear_cache == 'true' }}
        run: |
          rm -rf .vercel .next node_modules/.cache
          npm run clear:cache

      - name: Deploy to Vercel
        run: |
          if [ "${{ github.event.inputs.environment }}" = "production" ]; then
            vercel deploy --prod --force --token=${{ secrets.VERCEL_TOKEN }}
          else
            vercel deploy --force --token=${{ secrets.VERCEL_TOKEN }}
          fi
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### GitLab CI Example

```yaml
force_deploy:
  stage: deploy
  image: node:20
  before_script:
    - npm install -g vercel
    - npm ci
  script:
    - |
      if [ "$CLEAR_CACHE" = "true" ]; then
        rm -rf .vercel .next node_modules/.cache
        npm run clear:cache
      fi
    - |
      if [ "$CI_COMMIT_REF_NAME" = "main" ]; then
        vercel deploy --prod --force --token=$VERCEL_TOKEN
      else
        vercel deploy --force --token=$VERCEL_TOKEN
      fi
  variables:
    CLEAR_CACHE: "true"
  only:
    - main
    - develop
  when: manual
```

## Method 3: Purging Data Cache for Next.js

### Dashboard Method

#### 1. Access Data Cache Settings

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Functions"
3. Look for "Data Cache" or "Next.js Cache" section

#### 2. Purge Data Cache

1. Find the "Purge Data Cache" button
2. Select the cache types to purge:
   - **Route Cache**: Cached route handlers
   - **Data Cache**: Cached `fetch()` requests
   - **Full Route Cache**: Cached page renders
   - **Router Cache**: Client-side route cache

3. Click "Purge Selected Caches"
4. Confirm the action

#### 3. Verify Cache Purge

1. Check the deployment logs for cache purge confirmation
2. Monitor your application for updated data
3. Test dynamic routes and data fetching

### Programmatic Method

#### Using Vercel API

```javascript
// purge-data-cache.js
const fetch = require('node-fetch');

async function purgeDataCache(projectId, token) {
  const response = await fetch(
    `https://api.vercel.com/v1/projects/${projectId}/cache/purge`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'data'
      })
    }
  );

  if (response.ok) {
    console.log('Data cache purged successfully');
    return await response.json();
  } else {
    throw new Error(`Failed to purge cache: ${response.statusText}`);
  }
}

// Usage
purgeDataCache('your-project-id', 'your-vercel-token')
  .then(result => console.log('Cache purged:', result))
  .catch(error => console.error('Error:', error));
```

#### Using Next.js Revalidation

```javascript
// pages/api/revalidate.js or app/api/revalidate/route.js
export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATION_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    // Revalidate specific paths
    await res.revalidate('/');
    await res.revalidate('/about');
    await res.revalidate('/products');
    
    // Or revalidate by tag
    await res.revalidateTag('products');
    await res.revalidateTag('posts');
    
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
```

#### Trigger Revalidation

```bash
# Revalidate specific routes
curl -X POST "https://your-domain.com/api/revalidate?secret=your-secret"

# Or use the provided script
node scripts/clear-vercel-cache.js
```

## Automated Scripts

### Available Scripts

We've provided several scripts to automate cache clearing:

#### 1. Force Deploy Script (`scripts/force-deploy.sh`)

```bash
# Basic usage
./scripts/force-deploy.sh --env production

# With cache clearing
./scripts/force-deploy.sh --env production --clear-cache

# With validation
./scripts/force-deploy.sh --env production --validate
```

#### 2. Cache Clearing Script (`scripts/clear-vercel-cache.js`)

```bash
# Clear all caches
node scripts/clear-vercel-cache.js

# Clear specific caches
node scripts/clear-vercel-cache.js --skip-nextjs
node scripts/clear-vercel-cache.js --skip-vercel
node scripts/clear-vercel-cache.js --no-build-id
```

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "deploy:force": "vercel deploy --prod --force",
    "deploy:force:preview": "vercel deploy --force",
    "clear:cache": "node scripts/clear-vercel-cache.js",
    "clear:nextjs": "rm -rf .next",
    "clear:vercel": "rm -rf .vercel",
    "clear:all": "npm run clear:cache && npm run clear:nextjs && npm run clear:vercel",
    "deploy:fresh": "npm run clear:all && npm install && npm run deploy:force"
  }
}
```

## CI/CD Integration

### Environment Variables

Set these environment variables in your CI/CD system:

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
REVALIDATION_SECRET=your_revalidation_secret
```

### Automated Cache Clearing

#### On Dependency Updates

```yaml
# .github/workflows/dependency-update.yml
name: Clear Cache on Dependency Update

on:
  push:
    paths:
      - 'package.json'
      - 'package-lock.json'
      - 'pnpm-lock.yaml'
      - 'yarn.lock'

jobs:
  clear-cache-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Clear cache and force deploy
        run: |
          npm run clear:all
          npm run deploy:force
```

#### Scheduled Cache Clearing

```yaml
# .github/workflows/scheduled-cache-clear.yml
name: Scheduled Cache Clear

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  clear-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Clear Vercel cache
        run: node scripts/clear-vercel-cache.js
```

## Troubleshooting

### Common Issues

#### 1. "Build cache not cleared"

**Symptoms**: Deployment uses old build artifacts despite clearing cache

**Solutions**:
- Ensure you unchecked "Use existing Build Cache" in dashboard
- Use `--force` flag with Vercel CLI
- Clear local `.vercel` and `.next` directories
- Generate new build ID in `next.config.js`

#### 2. "Environment variables not updated"

**Symptoms**: New environment variables not reflected in deployment

**Solutions**:
- Redeploy after updating environment variables
- Clear function cache in addition to build cache
- Use `vercel env pull` to sync environment variables locally

#### 3. "Static assets still cached"

**Symptoms**: CSS, JS, or image changes not visible

**Solutions**:
- Clear edge cache from Vercel dashboard
- Update asset filenames or add cache busting
- Check CDN cache settings

#### 4. "Data not updating"

**Symptoms**: API responses or database queries return stale data

**Solutions**:
- Purge data cache specifically
- Use Next.js revalidation API
- Check ISR (Incremental Static Regeneration) settings

### Debug Commands

```bash
# Check Vercel project status
vercel ls

# Check deployment logs
vercel logs [deployment-url]

# Check environment variables
vercel env ls

# Check project settings
vercel project ls
```

### Verification Steps

1. **Check Build Logs**:
   - Look for "Cache miss" or "Building from scratch" messages
   - Verify all dependencies are reinstalled
   - Check for any cache-related warnings

2. **Test Deployment**:
   - Verify changes are reflected in the deployed application
   - Test dynamic functionality
   - Check browser developer tools for updated assets

3. **Monitor Performance**:
   - Fresh builds may take longer initially
   - Monitor for any new errors or warnings
   - Check application performance metrics

## Best Practices

### When to Clear Cache

1. **Always clear cache when**:
   - Major dependency updates
   - Build configuration changes
   - Environment variable updates
   - Debugging deployment issues

2. **Consider clearing cache when**:
   - Code changes aren't reflected
   - Performance issues arise
   - After long periods without deployment

### Cache Management Strategy

1. **Regular Maintenance**:
   - Schedule weekly cache clearing for active projects
   - Clear cache after major updates
   - Monitor cache hit rates and performance

2. **Development Workflow**:
   - Use preview deployments for testing
   - Clear cache before important releases
   - Document cache clearing procedures for team

3. **Monitoring**:
   - Set up alerts for deployment failures
   - Monitor build times and cache effectiveness
   - Track application performance metrics

### Performance Considerations

1. **Build Time Impact**:
   - Fresh builds take longer but ensure accuracy
   - Balance cache clearing frequency with build time
   - Use incremental cache clearing when possible

2. **Resource Usage**:
   - Monitor Vercel usage limits
   - Optimize build processes for efficiency
   - Consider build time limits for large projects

## Conclusion

This guide provides comprehensive methods to stop Vercel from using prebuilt artifacts. Choose the method that best fits your workflow:

- **Dashboard method**: Best for occasional manual interventions
- **CLI method**: Ideal for development and automated workflows
- **Programmatic method**: Perfect for CI/CD integration and automation

Regular cache management ensures your deployments are always fresh and reflect the latest changes in your codebase.

For additional support, refer to the [Vercel documentation](https://vercel.com/docs) or contact Vercel support.