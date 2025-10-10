# Broski's Kitchen Rewards MVP - Technical Architecture Document

## 1. Architecture Design

```mermaid
graph TD
    A[User Browser] --> B[Next.js Frontend Application]
    B --> C[NextAuth.js Authentication]
    B --> D[Firebase Client SDK]
    D --> E[Firestore Database]
    D --> F[Firebase Functions]
    F --> G[Admin SDK Operations]
    G --> E
    
    H[Admin Dashboard] --> B
    I[Vercel Edge Functions] --> J[API Routes]
    J --> F
    
    subgraph "Frontend Layer"
        B
        C
        H
    end
    
    subgraph "API Layer"
        I
        J
    end
    
    subgraph "Backend Services (Firebase)"
        D
        E
        F
        G
    end
    
    subgraph "External Integrations"
        K[Stripe Webhooks]
        L[Birthday Cron Jobs]
    end
    
    K --> F
    L --> F
```

## 2. Technology Description

- **Frontend**: React@18 + Next.js@14 + TypeScript + Tailwind CSS + Framer Motion
- **Authentication**: NextAuth.js with Firebase Admin custom claims
- **Backend**: Firebase Functions (Node.js 18) + Firestore + Firebase Admin SDK
- **Deployment**: Vercel (Frontend) + Firebase (Backend Services)
- **State Management**: React hooks + SWR for data fetching
- **UI Components**: Custom components with Tailwind CSS + Headless UI

## 3. Route Definitions

| Route | Purpose |
|-------|---------|
| /rewards | Customer rewards dashboard with points, tiers, and redemption interface |
| /rewards/referral | Dedicated referral page with QR code generation and tracking |
| /admin/rewards | Admin rewards management dashboard with user search and point adjustment |
| /admin/rewards/analytics | Detailed analytics and reporting for rewards system |
| /api/rewards/me | Get current user's rewards profile and transaction history |
| /api/rewards/redeem | Redeem points for discount coupons |
| /api/rewards/admin/adjust | Admin endpoint for point adjustments |
| /api/rewards/admin/users | Search and manage user rewards data |
| /api/rewards/referral/track | Track referral conversions and bonus distribution |

## 4. API Definitions

### 4.1 Core API

**User Rewards Profile**
```
GET /api/rewards/me
```

Response:
| Param Name | Param Type | Description |
|------------|------------|-------------|
| ok | boolean | Success status |
| profile | RewardsProfile | User's current rewards data |
| transactions | Transaction[] | Recent transaction history |

Example Response:
```json
{
  "ok": true,
  "profile": {
    "uid": "user123",
    "points": 1250,
    "lifetimePoints": 2100,
    "tier": "silver",
    "referralCode": "BRSK-7A9D",
    "multiplier": 1.05
  },
  "transactions": [
    {
      "id": "txn_001",
      "delta": 100,
      "reason": "signup_bonus",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Points Redemption**
```
POST /api/rewards/redeem
```

Request:
| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| points | number | true | Points to redeem |
| rewardId | string | true | Selected reward identifier |

Response:
| Param Name | Param Type | Description |
|------------|------------|-------------|
| ok | boolean | Success status |
| couponCode | string | Generated discount code |
| expiresAt | string | Coupon expiration date |

**Admin Point Adjustment**
```
POST /api/rewards/admin/adjust
```

Request:
| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| userId | string | true | Target user ID |
| points | number | true | Points to add/subtract |
| reason | string | true | Reason for adjustment |
| note | string | false | Additional notes |

## 5. Server Architecture Diagram

```mermaid
graph TD
    A[Next.js API Routes] --> B[Authentication Middleware]
    B --> C[Request Validation Layer]
    C --> D[Business Logic Layer]
    D --> E[Firebase Admin SDK]
    E --> F[Firestore Operations]
    
    G[Firebase Functions] --> H[Cloud Function Triggers]
    H --> I[Transaction Processing]
    I --> J[Point Calculations]
    J --> K[Tier Management]
    K --> F
    
    L[Webhook Handlers] --> M[Stripe Integration]
    M --> N[Order Processing]
    N --> O[Point Earning Logic]
    O --> G
    
    subgraph "API Layer"
        A
        B
        C
    end
    
    subgraph "Business Logic"
        D
        I
        J
        K
    end
    
    subgraph "Data Layer"
        E
        F
    end
    
    subgraph "External Triggers"
        G
        H
        L
        M
    end
```

## 6. Data Model

### 6.1 Data Model Definition

```mermaid
erDiagram
    USERS ||--o{ REWARDS_LEDGER : has
    USERS ||--o{ REDEMPTIONS : makes
    USERS ||--o{ REFERRALS : generates
    ADMIN_USERS ||--o{ ADMIN_ACTIONS : performs
    REWARDS_RULES ||--o{ PROMOS : defines
    
    USERS {
        string uid PK
        string email
        string displayName
        string phone
        date birthday
        string referralCode
        string referredBy
        number points
        string tier
        number lifetimePoints
        timestamp createdAt
        timestamp updatedAt
    }
    
    REWARDS_LEDGER {
        string ledgerId PK
        string uid FK
        number delta
        string reason
        object meta
        timestamp createdAt
        number balanceAfter
    }
    
    REDEMPTIONS {
        string redeemId PK
        string uid FK
        number pointsSpent
        string couponCode
        string status
        timestamp issuedAt
        timestamp usedAt
        timestamp expiresAt
        object rewardDetails
    }
    
    ADMIN_ACTIONS {
        string actionId PK
        string adminUid FK
        string action
        object payload
        timestamp createdAt
        string targetUserId
    }
    
    REWARDS_RULES {
        string ruleId PK
        string type
        number value
        object conditions
        boolean isActive
        timestamp createdAt
    }
    
    PROMOS {
        string promoId PK
        string name
        number multiplier
        timestamp startDate
        timestamp endDate
        boolean isActive
    }
```

### 6.2 Data Definition Language

**Users Collection (users)**
```sql
-- Firestore collection: users
-- Document ID: {uid}
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "phone": "string",
  "birthday": "timestamp",
  "referralCode": "string", // Format: BRSK-XXXX
  "referredBy": "string",
  "points": "number",
  "tier": "string", // bronze, silver, gold, platinum
  "lifetimePoints": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

-- Security Rules
allow read: if request.auth.uid == resource.id || isAdmin();
allow write: if request.auth.uid == resource.id || isAdmin();
```

**Rewards Ledger Collection (rewards_ledger)**
```sql
-- Firestore collection: rewards_ledger
-- Document ID: auto-generated
{
  "uid": "string",
  "delta": "number", // positive for earning, negative for spending
  "reason": "string", // signup, purchase, referral, birthday, redeem, admin_adjust
  "meta": {
    "orderId": "string",
    "referralCode": "string",
    "adminNote": "string",
    "redemptionId": "string"
  },
  "createdAt": "timestamp",
  "balanceAfter": "number"
}

-- Security Rules
allow read: if request.auth.uid == resource.data.uid || isAdmin();
allow create, update, delete: if false; // Server-side only
```

**Redemptions Collection (redemptions)**
```sql
-- Firestore collection: redemptions
-- Document ID: auto-generated
{
  "uid": "string",
  "pointsSpent": "number",
  "couponCode": "string", // Format: BRSK-XXXXXX
  "status": "string", // issued, used, expired
  "issuedAt": "timestamp",
  "usedAt": "timestamp",
  "expiresAt": "timestamp",
  "rewardDetails": {
    "name": "string",
    "description": "string",
    "value": "number"
  }
}

-- Security Rules
allow read: if request.auth.uid == resource.data.uid || isAdmin();
allow create, update, delete: if false; // Server-side only
```

**Admin Actions Collection (admin_actions)**
```sql
-- Firestore collection: admin_actions
-- Document ID: auto-generated
{
  "adminUid": "string",
  "action": "string", // adjust_points, issue_coupon, update_tier
  "payload": {
    "targetUserId": "string",
    "pointsDelta": "number",
    "reason": "string",
    "note": "string"
  },
  "createdAt": "timestamp"
}

-- Security Rules
allow read, write: if isAdmin();
```

**Firebase Functions Deployment**
```javascript
// functions/index.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

initializeApp();

export { 
  earnPoints,
  redeemPoints,
  adminAdjustPoints,
  birthdayCron,
  markCouponUsed 
} from './rewards';
```

**Environment Variables (.env.example)**
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=broskis-kitchen
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@broskis-kitchen.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# NextAuth Configuration
NEXTAUTH_URL=https://broskiskitchen.com
NEXTAUTH_SECRET=your-secret-key

# Stripe Integration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Rewards Configuration
REWARDS_SIGNUP_BONUS=100
REWARDS_BIRTHDAY_BONUS=250
REWARDS_REFERRAL_BONUS=300
REWARDS_TIER_THRESHOLDS=1000,5000,20000
REWARDS_TIER_MULTIPLIERS=1.0,1.05,1.1,1.15
```