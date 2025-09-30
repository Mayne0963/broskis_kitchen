# Firebase Optimization Guide

This document outlines the Firebase optimization implementation for O(1) auth-related lookups with proper indexing.

## Overview

The optimization standardizes user document structure, implements indexed queries, and provides fast security rules for efficient Firebase operations.

## User Document Structure

### Standardized Schema
```typescript
// Firestore: users/{uid}
interface UserDocument {
  uid: string;           // Document ID = uid (for O(1) lookups)
  email: string;         // Lowercased for consistent queries
  role: "admin" | "user"; // For fast role checks
  displayName?: string;  // Optional display name
  phone?: string;        // Optional phone number
  createdAt: Timestamp;  // Server timestamp
  updatedAt: Timestamp;  // Server timestamp
}
```

### Key Design Principles
- **Document ID = UID**: Enables O(1) lookups by UID
- **Lowercased Email**: Ensures consistent email queries
- **Role Field**: Stored directly for fast role-based access control
- **Indexed Fields**: Email and role are indexed for efficient queries

## Required Firebase Indexes

### Single-Field Indexes
Configure these in Firebase Console > Firestore Database > Indexes:

```
Collection: users
Field: email
Type: Ascending
Query Scope: Collection
Status: Enabled
```

### Composite Indexes
For advanced queries, create these composite indexes:

```
Collection: users
Fields: 
  - role (Ascending)
  - createdAt (Descending)
Query Scope: Collection
```

```
Collection: users
Fields:
  - role (Ascending) 
  - email (Ascending)
Query Scope: Collection
```

### Index Setup Commands
You can also create indexes programmatically or via Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and select project
firebase login
firebase use your-project-id

# Deploy indexes (if using firestore.indexes.json)
firebase deploy --only firestore:indexes
```

## Query Patterns

### Optimized User Lookups
All user queries are implemented in `src/lib/user.ts`:

```typescript
// O(1) lookup by UID (uses document ID)
const user = await getUserByUID(uid);

// O(1) lookup by email (uses single-field index)
const user = await getUserByEmail("user@example.com");

// Indexed role-based queries
const admins = await getUsersByRole("admin", { limit: 10 });
```

### Performance Characteristics
- **getUserByUID**: O(1) - Direct document access
- **getUserByEmail**: O(1) - Single-field index lookup
- **getUsersByRole**: O(log n) - Indexed range query
- **Search queries**: O(log n) - Indexed field queries

## Security Rules

### Fast Short-Circuit Functions
The security rules use optimized helper functions:

```javascript
function isSignedIn() { 
  return request.auth != null; 
}

function isSelf(uid) { 
  return isSignedIn() && request.auth.uid == uid; 
}

function isAdmin() { 
  return isSignedIn() && request.auth.token.role == "admin"; 
}
```

### Access Control
- **Read Access**: Users can read their own data, admins can read all
- **Write Access**: Users can update their own data, admins can update all
- **Role Checks**: Use custom claims for fast role verification

## Implementation Files

### Core Files
- `src/lib/user.ts` - Standardized user utilities and queries
- `firestore.rules` - Optimized security rules
- `src/lib/services/userService.ts` - Updated user service
- `src/lib/authServer.ts` - Server-side auth utilities
- `src/app/api/admin/users/route.ts` - Admin API with indexed queries

### Key Functions
- `getUserByUID(uid)` - O(1) user lookup by UID
- `getUserByEmail(email)` - O(1) user lookup by email
- `createUser(userData)` - Create user with standardized structure
- `updateUser(uid, updates)` - Update user with validation
- `syncUserRole(uid, role)` - Sync role with custom claims

## Migration Guide

### Existing Data Migration
If you have existing user data, migrate it to the new structure:

```typescript
// Example migration script
async function migrateUserData() {
  const users = await db.collection('users').get();
  
  for (const doc of users.docs) {
    const data = doc.data();
    const updates = {
      uid: doc.id,
      email: data.email?.toLowerCase() || '',
      role: data.role || 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await doc.ref.update(updates);
  }
}
```

### Custom Claims Setup
Ensure custom claims are set for role-based access:

```typescript
// Set custom claims for admin users
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
```

## Performance Monitoring

### Query Performance
Monitor query performance in Firebase Console:
- Check query execution times
- Monitor index usage
- Watch for missing index warnings

### Best Practices
1. **Always use limits** on queries to prevent large reads
2. **Use cursors** for pagination instead of offset
3. **Index all query fields** to avoid full collection scans
4. **Cache frequently accessed data** on the client side
5. **Use batch operations** for multiple writes

## Troubleshooting

### Common Issues
1. **Missing Index Error**: Create the required composite index
2. **Slow Queries**: Check if all query fields are indexed
3. **Security Rule Denials**: Verify custom claims are set correctly
4. **Case Sensitivity**: Ensure emails are lowercased consistently

### Debug Commands
```bash
# Check Firestore usage
firebase firestore:usage

# View security rules
firebase firestore:rules get

# Test security rules
firebase emulators:start --only firestore
```

## Cost Optimization

### Read Optimization
- Use document listeners instead of repeated queries
- Implement proper caching strategies
- Batch multiple document reads when possible

### Write Optimization
- Use batch writes for multiple operations
- Implement proper retry logic for failed writes
- Use transactions for atomic operations

### Index Optimization
- Only create indexes for actual query patterns
- Remove unused indexes to reduce storage costs
- Monitor index usage in Firebase Console

## Conclusion

This optimization provides:
- **O(1) user lookups** by UID and email
- **Indexed role-based queries** for admin operations
- **Fast security rules** with short-circuit evaluation
- **Standardized user structure** for consistency
- **Comprehensive documentation** for maintenance

All auth-related operations now use proper indexing for optimal performance and cost efficiency.