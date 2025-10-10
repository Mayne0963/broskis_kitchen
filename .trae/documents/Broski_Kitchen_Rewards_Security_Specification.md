# Broski's Kitchen Rewards MVP - Security Specification

## 1. Security Overview

This document outlines the comprehensive security measures implemented in the Broski's Kitchen Rewards MVP to protect user data, prevent fraud, and ensure system integrity.

### 1.1 Security Principles
- **Zero Trust Architecture**: No implicit trust, verify everything
- **Principle of Least Privilege**: Minimal access rights for users and systems
- **Defense in Depth**: Multiple layers of security controls
- **Data Minimization**: Collect and store only necessary data
- **Secure by Default**: Security controls enabled by default

### 1.2 Threat Model
**Primary Threats**:
- Unauthorized point manipulation
- Admin privilege escalation
- Data breaches and PII exposure
- Fraudulent redemptions
- Referral system abuse
- Session hijacking
- API abuse and DDoS attacks

## 2. Authentication & Authorization

### 2.1 User Authentication

**NextAuth.js Configuration**:
```javascript
// Security-hardened NextAuth configuration
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement secure password verification
        const user = await verifyCredentials(credentials);
        return user ? { id: user.uid, email: user.email } : null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    secret: process.env.NEXTAUTH_SECRET,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 // 24 hours
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Add custom claims from Firebase
        const customClaims = await getCustomClaims(user.id);
        token.role = customClaims?.role || 'user';
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      return session;
    }
  }
};
```

### 2.2 Role-Based Access Control (RBAC)

**User Roles**:
```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

interface UserPermissions {
  canViewRewards: boolean;
  canRedeemPoints: boolean;
  canAdjustPoints: boolean;
  canViewAllUsers: boolean;
  canManageAdmins: boolean;
}

const rolePermissions: Record<UserRole, UserPermissions> = {
  [UserRole.USER]: {
    canViewRewards: true,
    canRedeemPoints: true,
    canAdjustPoints: false,
    canViewAllUsers: false,
    canManageAdmins: false
  },
  [UserRole.ADMIN]: {
    canViewRewards: true,
    canRedeemPoints: true,
    canAdjustPoints: true,
    canViewAllUsers: true,
    canManageAdmins: false
  },
  [UserRole.SUPER_ADMIN]: {
    canViewRewards: true,
    canRedeemPoints: true,
    canAdjustPoints: true,
    canViewAllUsers: true,
    canManageAdmins: true
  }
};
```

### 2.3 Firebase Custom Claims

**Admin Claims Management**:
```javascript
// Firebase Function to set admin claims
export const setAdminClaims = functions.https.onCall(async (data, context) => {
  // Verify super admin privileges
  if (!context.auth?.token?.role === 'super_admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only super admins can manage admin roles'
    );
  }

  const { uid, role } = data;
  
  // Validate role
  if (!['user', 'admin', 'super_admin'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role specified'
    );
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Log admin action
    await admin.firestore().collection('admin_actions').add({
      adminUid: context.auth.uid,
      action: 'role_change',
      payload: { targetUid: uid, newRole: role },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update user role'
    );
  }
});
```

## 3. Firestore Security Rules

### 3.1 Comprehensive Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return request.auth.uid == uid;
    }
    
    function isAdmin() {
      return request.auth.token.role == 'admin' || 
             request.auth.token.role == 'super_admin';
    }
    
    function isSuperAdmin() {
      return request.auth.token.role == 'super_admin';
    }
    
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    function isValidPhoneNumber(phone) {
      return phone.matches('^\\+?[1-9]\\d{1,14}$');
    }
    
    function isValidPointsDelta(delta) {
      return delta is int && delta >= -10000 && delta <= 10000;
    }
    
    // Users collection
    match /users/{uid} {
      allow read: if isSignedIn() && (isOwner(uid) || isAdmin());
      allow create: if isSignedIn() && isOwner(uid) && 
                   isValidEmail(resource.data.email) &&
                   resource.data.points == 0 &&
                   resource.data.tier == 'bronze';
      allow update: if isSignedIn() && isOwner(uid) && 
                   // Users can only update their own profile fields
                   (!('points' in resource.data.diff(request.resource.data).affectedKeys()) &&
                    !('tier' in resource.data.diff(request.resource.data).affectedKeys()) &&
                    !('referralCode' in resource.data.diff(request.resource.data).affectedKeys()));
      allow delete: if false; // No deletions allowed
    }
    
    // Admin-only user updates (points, tier)
    match /users/{uid} {
      allow update: if isAdmin() && 
                   // Only allow specific admin updates
                   (resource.data.diff(request.resource.data).affectedKeys().hasOnly(['points', 'tier', 'updatedAt']));
    }
    
    // Rewards ledger - read-only for users, admin-managed
    match /rewards_ledger/{ledgerId} {
      allow read: if isSignedIn() && (isOwner(resource.data.uid) || isAdmin());
      allow create, update, delete: if false; // Only Cloud Functions can write
    }
    
    // Redemptions - read-only for users
    match /redemptions/{redeemId} {
      allow read: if isSignedIn() && (isOwner(resource.data.uid) || isAdmin());
      allow create, update, delete: if false; // Only Cloud Functions can write
    }
    
    // Admin actions - admin read-only
    match /admin_actions/{actionId} {
      allow read: if isAdmin();
      allow create, update, delete: if false; // Only Cloud Functions can write
    }
    
    // Rewards rules - admin read, super admin write
    match /rewards_rules/{ruleId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }
    
    // Promos - admin read, super admin write
    match /promos/{promoId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }
    
    // Idempotency keys - system use only
    match /idempotency_keys/{keyId} {
      allow read, write: if false; // Only Cloud Functions
    }
  }
}
```

### 3.2 Security Rule Testing

**Test Suite for Security Rules**:
```javascript
// security-rules-test.js
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');

describe('Firestore Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });
  
  test('Users can read their own data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const doc = alice.firestore().doc('users/alice');
    await assertSucceeds(doc.get());
  });
  
  test('Users cannot read other users data', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const doc = alice.firestore().doc('users/bob');
    await assertFails(doc.get());
  });
  
  test('Users cannot directly modify points', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const doc = alice.firestore().doc('users/alice');
    await assertFails(doc.update({ points: 9999 }));
  });
  
  test('Admins can modify user points', async () => {
    const admin = testEnv.authenticatedContext('admin', { role: 'admin' });
    const doc = admin.firestore().doc('users/alice');
    await assertSucceeds(doc.update({ points: 1000 }));
  });
});
```

## 4. API Security

### 4.1 Input Validation & Sanitization

**Validation Middleware**:
```typescript
import { z } from 'zod';

// Request validation schemas
const redeemPointsSchema = z.object({
  points: z.number().int().min(100).max(10000),
  rewardType: z.enum(['discount_5', 'discount_12', 'discount_35'])
});

const adjustPointsSchema = z.object({
  uid: z.string().uuid(),
  delta: z.number().int().min(-10000).max(10000),
  reason: z.string().min(1).max(100),
  adminNote: z.string().max(500).optional()
});

// Validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: NextApiRequest, res: NextApiResponse, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

### 4.2 Rate Limiting

**API Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many sensitive requests from this IP',
});

// Progressive delay for repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: 500, // Add 500ms delay per request after delayAfter
});

// Apply to specific routes
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting based on endpoint
  if (req.url?.includes('/redeem')) {
    await strictLimiter(req, res);
  } else {
    await apiLimiter(req, res);
  }
  
  // Continue with request handling
}
```

### 4.3 CORS Configuration

**Secure CORS Setup**:
```typescript
import Cors from 'cors';

const cors = Cors({
  origin: [
    'https://broskiskitchen.com',
    'https://www.broskiskitchen.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

export function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
```

## 5. Data Protection & Privacy

### 5.1 Data Encryption

**Sensitive Data Encryption**:
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('rewards-system'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('rewards-system'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 5.2 PII Data Handling

**Data Minimization & Anonymization**:
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  birthday?: string; // Stored as MM-DD only
  points: number;
  tier: string;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Anonymize user data for analytics
export function anonymizeUserData(user: UserProfile) {
  return {
    uid: hashUserId(user.uid),
    emailDomain: user.email.split('@')[1],
    hasDisplayName: !!user.displayName,
    hasPhone: !!user.phone,
    hasBirthday: !!user.birthday,
    points: user.points,
    tier: user.tier,
    hasReferrer: !!user.referredBy,
    accountAge: Date.now() - user.createdAt.getTime()
  };
}

function hashUserId(uid: string): string {
  return crypto.createHash('sha256').update(uid).digest('hex').substring(0, 16);
}
```

### 5.3 GDPR Compliance

**Data Export & Deletion**:
```typescript
// Export user data (GDPR Article 20)
export async function exportUserData(uid: string) {
  const userData = await admin.firestore().doc(`users/${uid}`).get();
  const ledgerData = await admin.firestore()
    .collection('rewards_ledger')
    .where('uid', '==', uid)
    .get();
  const redemptionData = await admin.firestore()
    .collection('redemptions')
    .where('uid', '==', uid)
    .get();

  return {
    profile: userData.data(),
    transactions: ledgerData.docs.map(doc => doc.data()),
    redemptions: redemptionData.docs.map(doc => doc.data()),
    exportedAt: new Date().toISOString()
  };
}

// Delete user data (GDPR Article 17)
export async function deleteUserData(uid: string) {
  const batch = admin.firestore().batch();
  
  // Delete user profile
  batch.delete(admin.firestore().doc(`users/${uid}`));
  
  // Delete user transactions
  const ledgerDocs = await admin.firestore()
    .collection('rewards_ledger')
    .where('uid', '==', uid)
    .get();
  ledgerDocs.forEach(doc => batch.delete(doc.ref));
  
  // Delete user redemptions
  const redemptionDocs = await admin.firestore()
    .collection('redemptions')
    .where('uid', '==', uid)
    .get();
  redemptionDocs.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
  
  // Delete from Firebase Auth
  await admin.auth().deleteUser(uid);
}
```

## 6. Fraud Prevention

### 6.1 Referral System Security

**Anti-Fraud Measures**:
```typescript
// Detect suspicious referral patterns
export async function validateReferral(referrerUid: string, newUserUid: string) {
  const checks = await Promise.all([
    checkIPAddress(referrerUid, newUserUid),
    checkDeviceFingerprint(referrerUid, newUserUid),
    checkEmailSimilarity(referrerUid, newUserUid),
    checkReferralVelocity(referrerUid),
    checkAccountAge(referrerUid)
  ]);
  
  const suspiciousFlags = checks.filter(check => check.suspicious);
  
  if (suspiciousFlags.length >= 2) {
    // Flag for manual review
    await flagForReview(referrerUid, newUserUid, suspiciousFlags);
    return false;
  }
  
  return true;
}

async function checkReferralVelocity(referrerUid: string) {
  const recentReferrals = await admin.firestore()
    .collection('users')
    .where('referredBy', '==', referrerUid)
    .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
    .get();
    
  return {
    suspicious: recentReferrals.size > 5,
    reason: 'High referral velocity',
    count: recentReferrals.size
  };
}
```

### 6.2 Points Manipulation Detection

**Anomaly Detection**:
```typescript
export async function detectPointsAnomaly(uid: string, delta: number) {
  const userHistory = await admin.firestore()
    .collection('rewards_ledger')
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
    
  const transactions = userHistory.docs.map(doc => doc.data());
  
  // Check for unusual patterns
  const anomalies = [
    checkLargeTransactions(transactions, delta),
    checkFrequencyAnomaly(transactions),
    checkPatternAnomaly(transactions)
  ];
  
  return anomalies.some(anomaly => anomaly.detected);
}

function checkLargeTransactions(transactions: any[], currentDelta: number) {
  const avgTransaction = transactions.reduce((sum, t) => sum + Math.abs(t.delta), 0) / transactions.length;
  const isLarge = Math.abs(currentDelta) > avgTransaction * 5;
  
  return {
    detected: isLarge,
    reason: 'Transaction significantly larger than average',
    threshold: avgTransaction * 5,
    current: Math.abs(currentDelta)
  };
}
```

## 7. Monitoring & Alerting

### 7.1 Security Event Monitoring

**Security Event Logger**:
```typescript
enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_ACCESS_VIOLATION = 'data_access_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

export async function logSecurityEvent(
  eventType: SecurityEventType,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  const event = {
    type: eventType,
    severity,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: details.ip,
    userAgent: details.userAgent,
    uid: details.uid
  };
  
  await admin.firestore().collection('security_events').add(event);
  
  // Send alerts for high/critical events
  if (severity === 'high' || severity === 'critical') {
    await sendSecurityAlert(event);
  }
}
```

### 7.2 Real-time Alerts

**Alert System**:
```typescript
export async function sendSecurityAlert(event: any) {
  const alertMessage = {
    title: `Security Alert: ${event.type}`,
    message: `Severity: ${event.severity}\nDetails: ${JSON.stringify(event.details)}`,
    timestamp: new Date().toISOString()
  };
  
  // Send to monitoring service (e.g., Slack, PagerDuty)
  await fetch(process.env.SECURITY_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertMessage)
  });
}
```

## 8. Security Testing

### 8.1 Automated Security Testing

**Security Test Suite**:
```typescript
describe('Security Tests', () => {
  test('SQL Injection Protection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/rewards/redeem')
      .send({ points: maliciousInput });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Validation failed');
  });
  
  test('XSS Protection', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/admin/adjust-points')
      .send({ reason: xssPayload });
    
    expect(response.status).toBe(400);
  });
  
  test('Authentication Required', async () => {
    const response = await request(app)
      .get('/api/rewards/me');
    
    expect(response.status).toBe(401);
  });
});
```

### 8.2 Penetration Testing Checklist

**Security Assessment Areas**:
- [ ] Authentication bypass attempts
- [ ] Authorization privilege escalation
- [ ] Input validation and injection attacks
- [ ] Session management vulnerabilities
- [ ] API endpoint security
- [ ] Rate limiting effectiveness
- [ ] Data exposure risks
- [ ] CORS configuration security
- [ ] Error message information leakage
- [ ] Infrastructure security

This comprehensive security specification ensures the Broski's Kitchen Rewards MVP maintains the highest security standards while providing a seamless user experience.