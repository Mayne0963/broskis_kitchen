# Firestore Usage Examples & CI Recommendations

This document provides practical usage examples for the Firestore safety-net wrapper and CI recommendations for managing indexes consistently across environments.

## 🛡️ Safety-Net Wrapper Usage Examples

### Basic Usage

```typescript
import { db } from "@/lib/firebase/admin";
import { safeQuery } from "@/lib/firestoreSafe";

// Basic safe query
const adminUsers = await safeQuery(async () => 
  db.collection("users")
    .where("role", "==", "admin")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get()
);

// Check if index is building
if (adminUsers && 'buildingIndex' in adminUsers) {
  console.log("Index is still building, showing placeholder");
  return { users: [], message: "Loading..." };
}

// Process normal results
const users = adminUsers.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Collection Query Helper

```typescript
import { safeCollectionQuery, isIndexBuilding } from "@/lib/firestoreSafe";

// Safe collection query with automatic empty array fallback
const orders = await safeCollectionQuery(async () =>
  db.collection("orders")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get()
);

// orders will be either QuerySnapshot or empty array if index is building
const orderData = Array.isArray(orders) 
  ? [] 
  : orders.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Document Query Helper

```typescript
import { safeDocumentQuery } from "@/lib/firestoreSafe";

// Safe document query
const userDoc = await safeDocumentQuery(async () =>
  db.collection("users").doc(userId).get()
);

if (!userDoc || !userDoc.exists) {
  return null;
}

const userData = { id: userDoc.id, ...userDoc.data() };
```

### Pre-configured Collection Helpers

```typescript
import { safeQueries } from "@/lib/firestoreSafe";

// Using pre-configured helpers
const adminUsers = await safeQueries.users
  .where("role", "==", "admin")
  .orderBy("createdAt", "desc")
  .limit(50)
  .get();

const userOrders = await safeQueries.orders
  .where("userId", "==", userId)
  .orderBy("createdAt", "desc")
  .get();

const pendingCatering = await safeQueries.cateringRequests
  .where("status", "==", "pending")
  .orderBy("createdAt", "desc")
  .get();
```

### Custom Retry Configuration

```typescript
import { safeQuery, RetryConfig } from "@/lib/firestoreSafe";

// Custom retry configuration for critical queries
const criticalRetryConfig: RetryConfig = {
  maxRetries: 5,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2
};

const criticalData = await safeQuery(async () =>
  db.collection("orders")
    .where("status", "==", "processing")
    .orderBy("createdAt", "desc")
    .get(),
  criticalRetryConfig
);
```

### Error Handling in API Routes

```typescript
// src/app/api/admin/users/route.ts
import { safeQuery, isIndexBuilding } from "@/lib/firestoreSafe";

export async function GET(request: Request) {
  try {
    const result = await safeQuery(async () =>
      db.collection("users")
        .where("role", "==", "admin")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get()
    );

    // Handle index building
    if (isIndexBuilding(result)) {
      return Response.json({
        users: [],
        indexBuilding: true,
        message: result.message,
        retryAfter: result.retryAfter
      }, { 
        status: 202, // Accepted but processing
        headers: {
          'Retry-After': String(Math.floor((result.retryAfter || 300000) / 1000))
        }
      });
    }

    // Process normal results
    const users = result.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return Response.json({ users });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return Response.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
```

### React Component Usage

```typescript
// src/components/admin/UsersList.tsx
import { useEffect, useState } from 'react';
import { isIndexBuilding } from '@/lib/firestoreSafe';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexBuilding, setIndexBuilding] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        if (data.indexBuilding) {
          setIndexBuilding(true);
          // Retry after the suggested time
          setTimeout(fetchUsers, data.retryAfter || 300000);
        } else {
          setUsers(data.users);
          setIndexBuilding(false);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  if (indexBuilding) {
    return (
      <div className="text-yellow-600">
        🔄 Database indexes are building. This may take a few minutes.
        The page will automatically refresh when ready.
      </div>
    );
  }

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          {user.email} - {user.role}
        </div>
      ))}
    </div>
  );
}
```

## 🔄 CI/CD Recommendations

### 1. Version Control for Indexes

```bash
# Always commit firestore.indexes.json to your repository
git add firestore.indexes.json
git commit -m "Add/update Firestore indexes for user queries"
```

### 2. GitHub Actions Workflow

Create `.github/workflows/firestore-indexes.yml`:

```yaml
name: Deploy Firestore Indexes

on:
  push:
    branches: [main]
    paths: ['firestore.indexes.json']
  
  workflow_dispatch:

jobs:
  deploy-indexes:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      
      - name: Authenticate Firebase
        run: echo "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}" | base64 -d > service-account.json
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ./service-account.json
      
      - name: Deploy Firestore Indexes
        run: |
          firebase use ${{ secrets.FIREBASE_PROJECT_ID }}
          firebase deploy --only firestore:indexes --token "${{ secrets.FIREBASE_TOKEN }}"
      
      - name: Cleanup
        run: rm -f service-account.json
```

### 3. Index Management Script

Create `scripts/manage-indexes.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Read current indexes
const indexesFile = './firestore.indexes.json';
if (!fs.existsSync(indexesFile)) {
  console.error('firestore.indexes.json not found');
  process.exit(1);
}

const indexes = JSON.parse(fs.readFileSync(indexesFile, 'utf8'));

console.log('📊 Current Firestore Indexes:');
console.log(`- ${indexes.indexes.length} composite indexes`);
console.log(`- ${indexes.fieldOverrides.length} field overrides`);

// Deploy indexes
try {
  console.log('\n🚀 Deploying indexes...');
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('✅ Indexes deployed successfully');
} catch (error) {
  console.error('❌ Failed to deploy indexes:', error.message);
  process.exit(1);
}
```

### 4. Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate firestore.indexes.json syntax
if [ -f "firestore.indexes.json" ]; then
  echo "🔍 Validating Firestore indexes..."
  node -e "JSON.parse(require('fs').readFileSync('firestore.indexes.json', 'utf8'))" || {
    echo "❌ Invalid JSON in firestore.indexes.json"
    exit 1
  }
  echo "✅ Firestore indexes valid"
fi
```

### 5. Environment-Specific Deployment

```bash
# Development
firebase use dev-project-id
firebase deploy --only firestore:indexes

# Staging
firebase use staging-project-id
firebase deploy --only firestore:indexes

# Production
firebase use prod-project-id
firebase deploy --only firestore:indexes
```

### 6. Index Monitoring Script

Create `scripts/check-indexes.js`:

```javascript
#!/usr/bin/env node

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

async function checkIndexes() {
  try {
    // This would require Firebase Admin SDK v11+ with index management
    console.log('🔍 Checking index status...');
    
    // For now, we can check if queries work
    const testQueries = [
      () => admin.firestore().collection('users')
        .where('role', '==', 'admin')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get(),
      
      () => admin.firestore().collection('orders')
        .where('status', '==', 'paid')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get()
    ];

    for (const query of testQueries) {
      try {
        await query();
        console.log('✅ Query successful');
      } catch (error) {
        if (error.code === 9) { // FAILED_PRECONDITION
          console.log('⏳ Index still building');
        } else {
          console.error('❌ Query failed:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Failed to check indexes:', error);
  }
}

checkIndexes();
```

## 📋 Best Practices Checklist

### Development Workflow

- [ ] Always test queries locally before deploying
- [ ] Use the safety-net wrapper for all production queries
- [ ] Commit `firestore.indexes.json` to version control
- [ ] Document new query patterns in `FIRESTORE_QUERY_PATTERNS.md`
- [ ] Test index building scenarios in development

### Production Deployment

- [ ] Deploy indexes before deploying application code
- [ ] Monitor index building status after deployment
- [ ] Have fallback UI for index building periods
- [ ] Set up alerts for index building failures
- [ ] Use staged deployments (dev → staging → prod)

### Monitoring & Maintenance

- [ ] Regular index usage analysis
- [ ] Remove unused indexes to reduce costs
- [ ] Monitor query performance metrics
- [ ] Set up automated index validation
- [ ] Document index requirements for new features

## 🚨 Emergency Procedures

### If Indexes Fail to Build

1. Check Firebase Console for error messages
2. Verify index definition syntax in `firestore.indexes.json`
3. Ensure sufficient Firestore quota
4. Contact Firebase support if needed
5. Use safety-net wrapper to maintain application functionality

### If Application Breaks Due to Missing Index

1. Deploy emergency index via Firebase Console
2. Add index to `firestore.indexes.json` for future deployments
3. Monitor application recovery
4. Update documentation with new requirements

## 📚 Related Documentation

- [Firestore Query Patterns](./FIRESTORE_QUERY_PATTERNS.md)
- [Firebase Optimization Guide](./FIREBASE_OPTIMIZATION.md)
- [Firestore Security Rules](../firestore.rules)
- [Index Configuration](../firestore.indexes.json)