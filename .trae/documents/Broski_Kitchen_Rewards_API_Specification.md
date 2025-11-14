# Broski's Kitchen Rewards MVP - API Specification

## 1. API Overview

The Broski's Kitchen Rewards API provides comprehensive endpoints for managing customer loyalty points, tier progression, referrals, and redemptions. All endpoints require authentication and follow RESTful conventions with JSON request/response formats.

**Base URL**: `https://broskiskitchen.com/api`
**Authentication**: NextAuth.js session-based authentication
**Content-Type**: `application/json`

## 2. Authentication & Authorization

### 2.1 Authentication Headers
```http
Cookie: next-auth.session-token=<session_token>
```

### 2.2 Authorization Levels
- **Customer**: Can access own rewards data and perform redemptions
- **Admin**: Can manage all user rewards and access analytics

## 3. Customer Rewards Endpoints

### 3.1 Get User Rewards Profile

**Endpoint**: `GET /api/rewards/me`

**Description**: Retrieves the authenticated user's complete rewards profile including points balance, tier status, and recent transaction history.

**Request Headers**:
```http
Cookie: next-auth.session-token=<session_token>
```

**Response**:
```json
{
  "ok": true,
  "profile": {
    "uid": "user_12345",
    "points": 1250,
    "lifetimePoints": 3500,
    "tier": "silver",
    "tierProgress": {
      "current": "silver",
      "next": "gold",
      "pointsToNext": 1500,
      "progressPercentage": 71.4
    },
    "multiplier": 1.05,
    "referralCode": "BRSK-7A9D",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:22:00Z"
  },
  "transactions": [
    {
      "id": "txn_001",
      "delta": 100,
      "reason": "signup_bonus",
      "balanceAfter": 1250,
      "createdAt": "2024-01-20T14:22:00Z",
      "meta": {
        "tier": "silver",
        "multiplier": 1.05
      }
    }
  ]
}
```

**Error Responses**:
```json
// 401 Unauthorized
{
  "ok": false,
  "reason": "unauthenticated",
  "message": "Please sign in to view rewards"
}

// 500 Server Error
{
  "ok": false,
  "reason": "server_error",
  "message": "Unable to load rewards data"
}
```

### 3.2 Redeem Points for Rewards

**Endpoint**: `POST /api/rewards/redeem`

**Description**: Redeems user points for discount coupons. Validates point balance and generates single-use coupon codes.

**Request Body**:
```json
{
  "points": 1000,
  "rewardId": "discount_5_off"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| points | number | Yes | Points to redeem (1000, 2000, or 5000) |
| rewardId | string | Yes | Reward identifier from catalog |

**Response**:
```json
{
  "ok": true,
  "redemption": {
    "id": "redeem_abc123",
    "couponCode": "BRSK-X7Y9Z2",
    "pointsSpent": 1000,
    "rewardValue": 5,
    "description": "$5 off your order",
    "issuedAt": "2024-01-20T15:30:00Z",
    "expiresAt": "2024-02-03T15:30:00Z",
    "status": "issued"
  },
  "newBalance": 250
}
```

**Error Responses**:
```json
// 400 Bad Request - Insufficient Points
{
  "ok": false,
  "error": "insufficient_points",
  "message": "You need 1000 points but only have 250",
  "currentPoints": 250,
  "requiredPoints": 1000
}

// 400 Bad Request - Invalid Reward
{
  "ok": false,
  "error": "invalid_reward",
  "message": "Reward not found in catalog",
  "availableRewards": [1000, 2000, 5000]
}
```

### 3.3 Get Redemption History

**Endpoint**: `GET /api/rewards/redemptions`

**Description**: Retrieves user's redemption history with coupon codes and usage status.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of redemptions to return (default: 25) |
| status | string | No | Filter by status: 'issued', 'used', 'expired' |

**Response**:
```json
{
  "ok": true,
  "redemptions": [
    {
      "id": "redeem_abc123",
      "couponCode": "BRSK-X7Y9Z2",
      "pointsSpent": 1000,
      "rewardValue": 5,
      "status": "used",
      "issuedAt": "2024-01-20T15:30:00Z",
      "usedAt": "2024-01-21T12:15:00Z",
      "expiresAt": "2024-02-03T15:30:00Z"
    }
  ],
  "totalRedemptions": 5,
  "totalPointsRedeemed": 7000
}
```

### 3.4 Generate Referral Link

**Endpoint**: `GET /api/rewards/referral`

**Description**: Generates referral links and QR codes for sharing.

**Response**:
```json
{
  "ok": true,
  "referral": {
    "code": "BRSK-7A9D",
    "shareUrl": "https://broskiskitchen.com?ref=BRSK-7A9D",
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A//broskiskitchen.com%3Fref%3DBRSK-7A9D",
    "totalReferrals": 3,
    "totalBonusEarned": 900
  }
}
```

### 3.5 Track Referral Signup

**Endpoint**: `POST /api/rewards/referral/track`

**Description**: Tracks when a referred user signs up and awards bonus points.

**Request Body**:
```json
{
  "referralCode": "BRSK-7A9D",
  "newUserId": "user_67890"
}
```

**Response**:
```json
{
  "ok": true,
  "bonusAwarded": {
    "referrerId": "user_12345",
    "bonusPoints": 300,
    "reason": "referral_bonus",
    "newUserBonus": 100
  }
}
```

## 4. Admin Rewards Endpoints

### 4.1 Search Users

**Endpoint**: `GET /api/rewards/admin/users`

**Description**: Search for users by email or phone for rewards management.

**Authorization**: Admin role required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query (email or phone) |
| limit | number | No | Results limit (default: 10) |

**Response**:
```json
{
  "ok": true,
  "users": [
    {
      "uid": "user_12345",
      "email": "customer@example.com",
      "displayName": "John Doe",
      "phone": "+1234567890",
      "points": 1250,
      "lifetimePoints": 3500,
      "tier": "silver",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastActivity": "2024-01-20T14:22:00Z"
    }
  ],
  "totalResults": 1
}
```

### 4.2 Adjust User Points

**Endpoint**: `POST /api/rewards/admin/adjust`

**Description**: Add or subtract points from a user's account with audit trail.

**Authorization**: Admin role required

**Request Body**:
```json
{
  "userId": "user_12345",
  "points": 500,
  "reason": "catering_bonus",
  "note": "Large catering order bonus - Event #12345"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | Target user ID |
| points | number | Yes | Points to add (positive) or subtract (negative) |
| reason | string | Yes | Reason code for adjustment |
| note | string | No | Additional notes for audit trail |

**Response**:
```json
{
  "ok": true,
  "adjustment": {
    "id": "adj_xyz789",
    "userId": "user_12345",
    "pointsDelta": 500,
    "previousBalance": 1250,
    "newBalance": 1750,
    "previousTier": "silver",
    "newTier": "silver",
    "reason": "catering_bonus",
    "note": "Large catering order bonus - Event #12345",
    "adminId": "admin_001",
    "createdAt": "2024-01-20T16:45:00Z"
  }
}
```

### 4.3 Issue Manual Coupon

**Endpoint**: `POST /api/rewards/admin/coupon`

**Description**: Issue discount coupons directly without point redemption.

**Authorization**: Admin role required

**Request Body**:
```json
{
  "userId": "user_12345",
  "couponType": "custom",
  "discountValue": 15,
  "description": "VIP customer appreciation",
  "expiryDays": 30
}
```

**Response**:
```json
{
  "ok": true,
  "coupon": {
    "id": "coupon_manual_001",
    "couponCode": "BRSK-VIP123",
    "userId": "user_12345",
    "discountValue": 15,
    "description": "VIP customer appreciation",
    "issuedAt": "2024-01-20T17:00:00Z",
    "expiresAt": "2024-02-19T17:00:00Z",
    "status": "issued",
    "issuedBy": "admin_001"
  }
}
```

### 4.4 Get Rewards Analytics

**Endpoint**: `GET /api/rewards/admin/analytics`

**Description**: Comprehensive analytics dashboard data for rewards system.

**Authorization**: Admin role required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Time period: '7d', '30d', '90d', '1y' (default: '30d') |
| includeCharts | boolean | No | Include chart data (default: false) |

**Response**:
```json
{
  "ok": true,
  "analytics": {
    "overview": {
      "totalUsers": 1250,
      "activeUsers": 890,
      "totalPointsIssued": 125000,
      "totalPointsRedeemed": 45000,
      "redemptionRate": 36.0,
      "averagePointsPerUser": 100
    },
    "tierDistribution": {
      "bronze": 650,
      "silver": 400,
      "gold": 150,
      "platinum": 50
    },
    "topRedemptions": [
      {
        "rewardId": "discount_5_off",
        "count": 120,
        "totalPoints": 120000
      }
    ],
    "recentActivity": [
      {
        "type": "redemption",
        "userId": "user_12345",
        "points": 1000,
        "timestamp": "2024-01-20T15:30:00Z"
      }
    ]
  }
}
```

### 4.5 Get Audit Trail

**Endpoint**: `GET /api/rewards/admin/audit`

**Description**: Retrieve audit trail of all admin actions on rewards system.

**Authorization**: Admin role required

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Number of actions to return (default: 50) |
| adminId | string | No | Filter by specific admin |
| action | string | No | Filter by action type |
| startDate | string | No | Start date (ISO format) |
| endDate | string | No | End date (ISO format) |

**Response**:
```json
{
  "ok": true,
  "auditTrail": [
    {
      "id": "audit_001",
      "adminId": "admin_001",
      "adminEmail": "admin@broskiskitchen.com",
      "action": "adjust_points",
      "targetUserId": "user_12345",
      "payload": {
        "pointsDelta": 500,
        "reason": "catering_bonus",
        "note": "Large catering order bonus"
      },
      "createdAt": "2024-01-20T16:45:00Z",
      "ipAddress": "192.168.1.100"
    }
  ],
  "totalActions": 156,
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": true
  }
}
```

## 5. Webhook Endpoints

### 5.1 Stripe Order Webhook

**Endpoint**: `POST /api/rewards/webhooks/stripe`

**Description**: Processes Stripe payment webhooks to award points for purchases.

**Headers**:
```http
Stripe-Signature: <webhook_signature>
```

**Request Body**: Stripe webhook payload

**Response**:
```json
{
  "ok": true,
  "processed": {
    "eventType": "payment_intent.succeeded",
    "orderId": "order_12345",
    "userId": "user_12345",
    "pointsAwarded": 150,
    "orderAmount": 15.00
  }
}
```

### 5.2 Birthday Bonus Webhook

**Endpoint**: `POST /api/rewards/webhooks/birthday`

**Description**: Triggered by cron job to award birthday bonuses.

**Authorization**: Internal service token

**Response**:
```json
{
  "ok": true,
  "processed": {
    "usersProcessed": 5,
    "bonusesAwarded": 1250,
    "date": "2024-01-20"
  }
}
```

## 6. Error Handling

### 6.1 Standard Error Format

All API endpoints return errors in a consistent format:

```json
{
  "ok": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error context"
  }
}
```

### 6.2 Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `unauthenticated` | 401 | User not logged in |
| `unauthorized` | 403 | Insufficient permissions |
| `invalid_request` | 400 | Malformed request data |
| `insufficient_points` | 400 | Not enough points for redemption |
| `invalid_reward` | 400 | Reward not found in catalog |
| `user_not_found` | 404 | Target user does not exist |
| `coupon_expired` | 400 | Coupon has expired |
| `coupon_used` | 400 | Coupon already used |
| `rate_limited` | 429 | Too many requests |
| `server_error` | 500 | Internal server error |

## 7. Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Customer endpoints**: 100 requests per minute per user
- **Admin endpoints**: 500 requests per minute per admin
- **Webhook endpoints**: 1000 requests per minute per IP

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## 8. Testing & Development

### 8.1 Test Environment

**Base URL**: `https://broskiskitchen-dev.vercel.app/api`

### 8.2 Test Data

Test users and scenarios are available in the development environment:
- Test user: `test@broskiskitchen.com` (password: `test123`)
- Test admin: `admin@broskiskitchen.com` (password: `admin123`)
- Test referral codes: `BRSK-TEST1`, `BRSK-TEST2`

This API specification provides comprehensive documentation for integrating with the Broski's Kitchen Rewards system, enabling both customer-facing applications and administrative tools.