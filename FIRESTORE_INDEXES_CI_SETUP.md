# Firestore Indexes CI/CD Setup Guide

This guide explains how to set up automatic deployment of Firestore indexes using GitHub Actions.

## 🚀 What This Workflow Does

The workflow automatically deploys your `firestore.indexes.json` file to Firebase whenever:
- You push changes to `main`, `staging`, or `develop` branches
- The `firestore.indexes.json` file is modified
- You manually trigger the workflow

## 🔧 Required GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Authentication Method 1: Firebase CI Token (Recommended for simplicity)

1. **FIREBASE_TOKEN**
   ```bash
   # Run this locally to get your token
   firebase login:ci
   # Copy the token and add it as a secret
   ```

### Authentication Method 2: Service Account (Recommended for production)

1. **GCP_SA_KEY**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **IAM & Admin** → **Service Accounts**
   - Create a new service account or use existing one
   - Assign roles: **Firebase Admin** or **Editor**
   - Create a JSON key
   - Copy the entire JSON content and paste as secret value

### Project Configuration (Optional - Multi-environment)

If you want different Firebase projects for different branches:

1. **FIREBASE_PROJECT_ID_PROD** = `broskis-kitchen-44d2d` (for main branch)
2. **FIREBASE_PROJECT_ID_STAGING** = `your-staging-project-id` (for staging branch)  
3. **FIREBASE_PROJECT_ID_DEV** = `your-dev-project-id` (for develop branch)

> **Note**: If these aren't set, it defaults to `broskis-kitchen-44d2d` for all branches.

## 📋 Current Project Configuration

Based on your `.firebaserc` file:
- **Default Project**: `broskis-kitchen-44d2d`
- **Indexes File**: `firestore.indexes.json` ✅ (exists with 16 indexes)

## 🔄 Workflow Features

### ✅ Smart Branch Handling
- **main** → Production deployment
- **staging** → Staging deployment  
- **develop** → Development deployment

### ✅ Dual Authentication Support
- Firebase CI Token (simple)
- Google Service Account (secure)
- Automatic fallback with helpful error messages

### ✅ Safety Features
- JSON validation before deployment
- Concurrency control (prevents multiple deployments)
- 10-minute timeout protection
- Force deployment to handle conflicts

### ✅ Comprehensive Logging
- Clear deployment status messages
- Project confirmation
- Success/failure notifications
- Deployment summary

## 🚦 How to Use

### 1. Set Up Secrets (Choose One Method)

**Option A: Firebase Token**
```bash
firebase login:ci
# Copy token → Add as FIREBASE_TOKEN secret
```

**Option B: Service Account**
1. Download service account JSON from Google Cloud
2. Copy entire JSON → Add as GCP_SA_KEY secret

### 2. Test the Workflow

Make a change to `firestore.indexes.json` and push:
```bash
# Edit your indexes file
vim firestore.indexes.json

# Commit and push
git add firestore.indexes.json
git commit -m "Update Firestore indexes"
git push origin main
```

### 3. Monitor Deployment

- Go to **Actions** tab in your GitHub repository
- Watch the "Firestore Indexes" workflow run
- Check logs for deployment status

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Error**
   ```
   ❌ ERROR: No authentication method configured!
   ```
   **Solution**: Add either `FIREBASE_TOKEN` or `GCP_SA_KEY` secret

2. **Invalid JSON**
   ```
   Error: Invalid JSON in firestore.indexes.json
   ```
   **Solution**: Validate your JSON syntax using `jq` or online validator

3. **Permission Denied**
   ```
   Error: Permission denied
   ```
   **Solution**: Ensure your service account has Firebase Admin/Editor role

4. **Project Not Found**
   ```
   Error: Project not found
   ```
   **Solution**: Verify project ID in secrets matches your Firebase project

### Manual Trigger

You can manually run the workflow:
1. Go to **Actions** tab
2. Select "Firestore Indexes" workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

## 📊 Current Indexes Summary

Your `firestore.indexes.json` contains **16 composite indexes** for:
- **users** (role + createdAt, role + email)
- **cateringRequests** (status + createdAt, customer.email + createdAt, packageId + createdAt)
- **orders** (userId + createdAt, status + createdAt)
- **rewards** (userId + createdAt)
- **rewardRedemptions** (userId + createdAt)
- **spins** (userId + createdAt, userId + dateKey)
- **coupons** (code + expiresAt)
- **offers** (active + startsAt)
- **menuItems** (category + name, available + updatedAt)
- **events** (locationId + startsAt)

Plus **3 field overrides** for optimized single-field queries.

## 🎯 Next Steps

1. ✅ Workflow file created
2. ⏳ Add required secrets to GitHub repository
3. ⏳ Test deployment by modifying `firestore.indexes.json`
4. ⏳ Monitor first deployment in Actions tab
5. ⏳ Set up branch-specific projects (optional)

---

**Need Help?** Check the workflow logs in the Actions tab for detailed error messages and deployment status.