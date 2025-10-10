# Broski's Kitchen Rewards MVP - Implementation Guide

## 1. Firebase Functions Implementation

### 1.1 Core Functions Structure

**functions/src/index.ts**

```typescript
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

initializeApp();

// Export all reward functions
export { 
  earnPoints,
  redeemPoints,
  adminAdjustPoints,
  birthdayCron,
  markCouponUsed,
  processReferralBonus
} from './rewards';

// Export webhook handlers
export { stripeWebhook } from './webhooks';
```

**functions/src/rewards.ts**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Tier configuration
const TIER_CONFIG = {
  bronze: { min: 0, max: 999, multiplier: 1.0 },
  silver: { min: 1000, max: 4999, multiplier: 1.05 },
  gold: { min: 5000, max: 19999, multiplier: 1.1 },
  platinum: { min: 20000, max: Infinity, multiplier: 1.15 }
};

// Reward catalog
const REWARD_CATALOG = {
  1000: { value: 5, description: '$5 off your order' },
  2000: { value: 12, description: '$12 off your order' },
  5000: { value: 35, description: '$35 off your order' }
};

// Calculate tier based on lifetime points
function calculateTier(lifetimePoints: number): string {
  for (const [tier, config] of Object.entries(TIER_CONFIG)) {
    if (lifetimePoints >= config.min && lifetimePoints <= config.max) {
      return tier;
    }
  }
  return 'bronze';
}

// Earn points function
export const earnPoints = functions.https.onCall(async (data, context) => {
  const { uid } = context.auth ?? {};
  const { points, reason, meta = {} } = data;
  
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  }
  
  if (!points || points <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid points amount.');
  }
  
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await tx.get(userRef);
    
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    
    const userData = userSnap.data()!;
    const currentPoints = userData.points || 0;
    const lifetimePoints = userData.lifetimePoints || 0;
    const newLifetimePoints = lifetimePoints + points;
    const newTier = calculateTier(newLifetimePoints);
    const multiplier = TIER_CONFIG[newTier as keyof typeof TIER_CONFIG].multiplier;
    const adjustedPoints = Math.floor(points * multiplier);
    const newCurrentPoints = currentPoints + adjustedPoints;
    
    // Update user document
    tx.update(userRef, {
      points: newCurrentPoints,
      lifetimePoints: newLifetimePoints,
      tier: newTier,
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    // Create ledger entry
    const ledgerRef = db.collection('rewards_ledger').doc();
    tx.create(ledgerRef, {
      uid,
      delta: adjustedPoints,
      reason,
      meta: {
        ...meta,
        originalPoints: points,
        multiplier,
        tier: newTier
      },
      createdAt: admin.firestore.Timestamp.now(),
      balanceAfter: newCurrentPoints
    });
  });
  
  return { ok: true, message: 'Points earned successfully' };
});

// Redeem points function (as provided in requirements)
export const redeemPoints = functions.https.onCall(async (data, context) => {
  const { uid } = context.auth ?? {};
  const { points } = data;
  
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  
  if (!REWARD_CATALOG[points as keyof typeof REWARD_CATALOG]) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid reward selection.');
  }
  
  const db = admin.firestore();
  let couponCode = '';
  
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${uid}`);
    const userSnap = await tx.get(userRef);
    const current = userSnap.get('points') || 0;
    
    if (current < points) {
      throw new functions.https.HttpsError('failed-precondition', 'Not enough points.');
    }
    
    couponCode = `BRSK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 14*24*60*60*1000);
    
    const redRef = db.collection('redemptions').doc();
    tx.create(redRef, { 
      uid, 
      pointsSpent: points, 
      couponCode, 
      status: 'issued', 
      issuedAt: now, 
      expiresAt,
      rewardDetails: REWARD_CATALOG[points as keyof typeof REWARD_CATALOG]
    });
    
    tx.create(db.collection('rewards_ledger').doc(), { 
      uid, 
      delta: -points, 
      reason: 'redeem', 
      meta: { redemptionId: redRef.id }, 
      createdAt: now,
      balanceAfter: current - points
    });
    
    tx.update(userRef, { 
      points: current - points,
      updatedAt: now
    });
  });
  
  return { ok: true, couponCode };
});

// Admin adjust points function
export const adminAdjustPoints = functions.https.onCall(async (data, context) => {
  const { uid: adminUid } = context.auth ?? {};
  const { userId, points, reason, note } = data;
  
  if (!adminUid) {
    throw new functions.https.HttpsError('unauthenticated', 'Admin login required.');
  }
  
  // Verify admin role
  const adminUser = await admin.auth().getUser(adminUid);
  if (!adminUser.customClaims?.role || adminUser.customClaims.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }
  
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${userId}`);
    const userSnap = await tx.get(userRef);
    
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    
    const userData = userSnap.data()!;
    const currentPoints = userData.points || 0;
    const lifetimePoints = userData.lifetimePoints || 0;
    const newCurrentPoints = Math.max(0, currentPoints + points);
    const newLifetimePoints = points > 0 ? lifetimePoints + points : lifetimePoints;
    const newTier = calculateTier(newLifetimePoints);
    
    // Update user document
    tx.update(userRef, {
      points: newCurrentPoints,
      lifetimePoints: newLifetimePoints,
      tier: newTier,
      updatedAt: admin.firestore.Timestamp.now()
    });
    
    // Create ledger entry
    const ledgerRef = db.collection('rewards_ledger').doc();
    tx.create(ledgerRef, {
      uid: userId,
      delta: points,
      reason: 'admin_adjust',
      meta: {
        adminUid,
        originalReason: reason,
        note
      },
      createdAt: admin.firestore.Timestamp.now(),
      balanceAfter: newCurrentPoints
    });
    
    // Create admin action log
    const actionRef = db.collection('admin_actions').doc();
    tx.create(actionRef, {
      adminUid,
      action: 'adjust_points',
      payload: {
        targetUserId: userId,
        pointsDelta: points,
        reason,
        note
      },
      createdAt: admin.firestore.Timestamp.now()
    });
  });
  
  return { ok: true, message: 'Points adjusted successfully' };
});

// Birthday bonus cron job
export const birthdayCron = functions.pubsub.schedule('0 9 * * *').onRun(async (context) => {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  const usersSnapshot = await db.collection('users')
    .where('birthday', '!=', null)
    .get();
  
  const batch = db.batch();
  let processedCount = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const birthday = userData.birthday?.toDate();
    
    if (birthday && birthday.getMonth() + 1 === todayMonth && birthday.getDate() === todayDay) {
      // Check if birthday bonus already given this year
      const thisYear = today.getFullYear();
      const ledgerSnapshot = await db.collection('rewards_ledger')
        .where('uid', '==', userDoc.id)
        .where('reason', '==', 'birthday')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(thisYear, 0, 1)))
        .limit(1)
        .get();
      
      if (ledgerSnapshot.empty) {
        const currentPoints = userData.points || 0;
        const birthdayBonus = 250;
        
        // Update user points
        batch.update(userDoc.ref, {
          points: currentPoints + birthdayBonus,
          lifetimePoints: (userData.lifetimePoints || 0) + birthdayBonus,
          updatedAt: admin.firestore.Timestamp.now()
        });
        
        // Create ledger entry
        const ledgerRef = db.collection('rewards_ledger').doc();
        batch.create(ledgerRef, {
          uid: userDoc.id,
          delta: birthdayBonus,
          reason: 'birthday',
          meta: {
            year: thisYear
          },
          createdAt: admin.firestore.Timestamp.now(),
          balanceAfter: currentPoints + birthdayBonus
        });
        
        processedCount++;
      }
    }
  }
  
  if (processedCount > 0) {
    await batch.commit();
  }
  
  console.log(`Birthday cron processed ${processedCount} users`);
  return null;
});

// Mark coupon as used
export const markCouponUsed = functions.https.onCall(async (data, context) => {
  const { couponCode } = data;
  
  if (!couponCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Coupon code required.');
  }
  
  await db.runTransaction(async (tx) => {
    const redemptionSnapshot = await db.collection('redemptions')
      .where('couponCode', '==', couponCode)
      .where('status', '==', 'issued')
      .limit(1)
      .get();
    
    if (redemptionSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Valid coupon not found.');
    }
    
    const redemptionDoc = redemptionSnapshot.docs[0];
    const redemptionData = redemptionDoc.data();
    
    // Check if coupon is expired
    const now = admin.firestore.Timestamp.now();
    if (redemptionData.expiresAt.toMillis() < now.toMillis()) {
      throw new functions.https.HttpsError('failed-precondition', 'Coupon has expired.');
    }
    
    // Mark as used
    tx.update(redemptionDoc.ref, {
      status: 'used',
      usedAt: now
    });
  });
  
  return { ok: true, message: 'Coupon marked as used' };
});
```

## 2. Next.js Components Implementation

### 2.1 Enhanced Rewards Page Component

**src/app/rewards/page.tsx**

```typescript
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth/server';
import { RewardsClient } from './RewardsClient';
import { ReferralProvider } from '@/components/rewards/ReferralProvider';

export default async function RewardsPage() {
  const user = await requireUser();
  
  if (!user.ok) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold mb-2">Rewards</h1>
        <p className="text-white/70">
          Please <a className="underline" href="/login">sign in</a> to view your rewards.
        </p>
      </div>
    );
  }

  return (
    <ReferralProvider>
      <Suspense fallback={<RewardsLoadingSkeleton />}>
        <RewardsClient userId={user.uid} />
      </Suspense>
    </ReferralProvider>
  );
}

function RewardsLoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="card animate-pulse">
        <div className="h-8 bg-white/10 rounded mb-4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card animate-pulse">
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
        <div className="card animate-pulse">
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}
```

### 2.2 React Hooks Implementation

**src/hooks/useRewards.ts**

```typescript
import { useState, useEffect } from 'react';
import useSWR from 'swr';

interface RewardsProfile {
  uid: string;
  points: number;
  lifetimePoints: number;
  tier: string;
  referralCode: string;
  multiplier: number;
}

interface Transaction {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
  balanceAfter: number;
  meta?: any;
}

interface UseRewardsReturn {
  profile: RewardsProfile | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useRewards(): UseRewardsReturn {
  const { data, error, mutate } = useSWR('/api/rewards/me', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  });

  return {
    profile: data?.profile || null,
    transactions: data?.transactions || [],
    loading: !data && !error,
    error: error ? 'Failed to load rewards data' : null,
    refetch: mutate
  };
}
```

**src/hooks/useRedeem.ts**

```typescript
import { useState } from 'react';

interface RedeemResult {
  success: boolean;
  couponCode?: string;
  error?: string;
}

interface UseRedeemReturn {
  redeem: (points: number) => Promise<RedeemResult>;
  loading: boolean;
}

export function useRedeem(): UseRedeemReturn {
  const [loading, setLoading] = useState(false);

  const redeem = async (points: number): Promise<RedeemResult> => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });

      const data = await response.json();

      if (data.ok) {
        return {
          success: true,
          couponCode: data.couponCode
        };
      } else {
        return {
          success: false,
          error: data.message || 'Redemption failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error occurred'
      };
    } finally {
      setLoading(false);
    }
  };

  return { redeem, loading };
}
```

**src/hooks/useReferral.ts**

```typescript
import { useState, useEffect } from 'react';

interface UseReferralReturn {
  referralCode: string | null;
  qrCodeUrl: string | null;
  copyToClipboard: () => void;
  shareUrl: string | null;
  trackReferral: (code: string) => void;
}

export function useReferral(userReferralCode?: string): UseReferralReturn {
  const [referralCode, setReferralCode] = useState<string | null>(userReferralCode || null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = referralCode ? `${baseUrl}?ref=${referralCode}` : null;

  useEffect(() => {
    if (referralCode) {
      // Generate QR code URL using a service like qr-server.com
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl || '')}`;
      setQrCodeUrl(qrUrl);
    }
  }, [referralCode, shareUrl]);

  const copyToClipboard = async () => {
    if (shareUrl && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const trackReferral = (code: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('referralCode', code);
    }
  };

  // Check for referral code in URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      if (refCode) {
        trackReferral(refCode);
      }
    }
  }, []);

  return {
    referralCode,
    qrCodeUrl,
    copyToClipboard,
    shareUrl,
    trackReferral
  };
}
```

## 3. Admin Dashboard Implementation

### 3.1 Admin Rewards Panel Component

**src/components/admin/AdminRewardsPanel.tsx**

```typescript
'use client';

import { useState } from 'react';
import { useAdminRewards } from '@/hooks/useAdminRewards';
import { UserSearch } from './UserSearch';
import { PointsAdjustment } from './PointsAdjustment';
import { RewardsAnalytics } from './RewardsAnalytics';
import { AuditTrail } from './AuditTrail';

export function AdminRewardsPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUser, setSelectedUser] = useState(null);

  const tabs = [
    { id: 'users', label: 'User Management' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'audit', label: 'Audit Trail' }
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-4">Rewards Management</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <UserSearch onUserSelect={setSelectedUser} />
            {selectedUser && (
              <PointsAdjustment 
                user={selectedUser} 
                onUpdate={() => setSelectedUser(null)} 
              />
            )}
          </div>
        )}

        {activeTab === 'analytics' && <RewardsAnalytics />}
        {activeTab === 'audit' && <AuditTrail />}
      </div>
    </div>
  );
}
```

## 4. Security Rules Implementation

**firestore.rules (Enhanced)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isSelf(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    
    function isAdmin() {
      return isSignedIn() && request.auth.token.role == "admin";
    }

    // Users collection - enhanced for rewards
    match /users/{uid} {
      allow read: if isSelf(uid) || isAdmin();
      allow create: if isSelf(uid) && 
                      request.resource.data.keys().hasAll(['email', 'createdAt']) &&
                      request.resource.data.points == 0 &&
                      request.resource.data.lifetimePoints == 0 &&
                      request.resource.data.tier == 'bronze';
      allow update: if (isSelf(uid) && 
                       // Users can only update non-critical fields
                       !request.resource.data.diff(resource.data).affectedKeys()
                         .hasAny(['points', 'lifetimePoints', 'tier'])) ||
                       isAdmin();
    }

    // Rewards ledger - read-only for users, server-write only
    match /rewards_ledger/{ledgerId} {
      allow read: if isSignedIn() && 
                     (resource.data.uid == request.auth.uid || isAdmin());
      allow create, update, delete: if false; // Server-side only
    }

    // Redemptions - read-only for users, server-write only
    match /redemptions/{redeemId} {
      allow read: if isSignedIn() && 
                     (resource.data.uid == request.auth.uid || isAdmin());
      allow create, update, delete: if false; // Server-side only
    }

    // Admin actions - admin only
    match /admin_actions/{actionId} {
      allow read, write: if isAdmin();
    }

    // Rewards rules - read for all, write for admin
    match /rewards_rules/{ruleId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Promos - read for all, write for admin
    match /promos/{promoId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 5. Deployment Configuration

### 5.1 Environment Variables Template

**`.env.example`**

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=broskis-kitchen-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@broskis-kitchen-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# NextAuth Configuration
NEXTAUTH_URL=https://broskiskitchen.com
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Rewards System Configuration
REWARDS_SIGNUP_BONUS=100
REWARDS_BIRTHDAY_BONUS=250
REWARDS_REFERRAL_BONUS=300

# Tier Configuration (JSON format)
REWARDS_TIER_CONFIG={"bronze":{"min":0,"max":999,"multiplier":1.0},"silver":{"min":1000,"max":4999,"multiplier":1.05},"gold":{"min":5000,"max":19999,"multiplier":1.1},"platinum":{"min":20000,"max":999999,"multiplier":1.15}}

# Reward Catalog (JSON format)
REWARDS_CATALOG={"1000":{"value":5,"description":"$5 off your order"},"2000":{"value":12,"description":"$12 off your order"},"5000":{"value":35,"description":"$35 off your order"}}
```

### 5.2 Vercel Deployment Configuration

**vercel.json (Updated)**

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "FIREBASE_PROJECT_ID": "@firebase_project_id",
    "FIREBASE_CLIENT_EMAIL": "@firebase_client_email",
    "FIREBASE_PRIVATE_KEY": "@firebase_private_key",
    "NEXTAUTH_URL": "@nextauth_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "STRIPE_SECRET_KEY": "@stripe_secret_key",
    "STRIPE_WEBHOOK_SECRET": "@stripe_webhook_secret"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase_project_id"
    }
  }
}
```

This implementation guide provides the complete foundation for the Broski's Kitchen Rewards MVP, including secure Firebase Functions, comprehensive React components, admin management tools, and proper deployment configuration.
