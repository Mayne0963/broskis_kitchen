# Firestore Query Patterns

This document provides comprehensive query patterns for all collections in the Broski's Kitchen application. These patterns are optimized to work with the indexes defined in `firestore.indexes.json`.

## 📊 Collection Query Patterns

### 👥 USERS Collection

```typescript
import { db } from "@/lib/firebase/admin";

// Get admin users sorted by creation date
const adminUsers = await db.collection("users")
  .where("role", "==", "admin")
  .orderBy("createdAt", "desc")
  .limit(50)
  .get();

// Get regular users sorted by email
const regularUsers = await db.collection("users")
  .where("role", "==", "user")
  .orderBy("email", "asc")
  .limit(100)
  .get();

// Find user by email (single field index)
const userByEmail = await db.collection("users")
  .where("email", "==", emailLower)
  .limit(1)
  .get();
```

### 🍽️ CATERING REQUESTS Collection

```typescript
// Get pending catering requests
const pendingRequests = await db.collection("cateringRequests")
  .where("status", "==", "pending")
  .orderBy("createdAt", "desc")
  .get();

// Get catering requests by customer email
const customerRequests = await db.collection("cateringRequests")
  .where("customer.email", "==", emailLower)
  .orderBy("createdAt", "desc")
  .get();

// Get requests for specific package
const packageRequests = await db.collection("cateringRequests")
  .where("packageId", "==", pkgId)
  .orderBy("createdAt", "desc")
  .get();

// Get requests by status with pagination
const statusRequests = await db.collection("cateringRequests")
  .where("status", "==", "confirmed")
  .orderBy("createdAt", "desc")
  .limit(20)
  .get();
```

### 📦 ORDERS Collection

```typescript
// Get user's orders
const userOrders = await db.collection("orders")
  .where("userId", "==", uid)
  .orderBy("createdAt", "desc")
  .get();

// Get orders by status
const paidOrders = await db.collection("orders")
  .where("status", "==", "paid")
  .orderBy("createdAt", "desc")
  .get();

// Get recent orders with limit
const recentOrders = await db.collection("orders")
  .where("status", "==", "completed")
  .orderBy("createdAt", "desc")
  .limit(10)
  .get();
```

### 🎁 REWARDS Collection

```typescript
// Get user's rewards
const userRewards = await db.collection("rewards")
  .where("userId", "==", uid)
  .orderBy("createdAt", "desc")
  .get();

// Get user's reward redemptions
const userRedemptions = await db.collection("rewardRedemptions")
  .where("userId", "==", uid)
  .orderBy("createdAt", "desc")
  .get();

// Get active rewards for user
const activeRewards = await db.collection("rewards")
  .where("userId", "==", uid)
  .where("status", "==", "active")
  .orderBy("createdAt", "desc")
  .get();
```

### 🎰 SPINS Collection

```typescript
// Get user's spin history
const userSpins = await db.collection("spins")
  .where("userId", "==", uid)
  .orderBy("createdAt", "desc")
  .get();

// Get user's spins for specific date (optimized for daily limits)
const dailySpins = await db.collection("spins")
  .where("userId", "==", uid)
  .where("dateKey", "==", dateKey)
  .get();

// Get user's spins sorted by date key
const spinsByDate = await db.collection("spins")
  .where("userId", "==", uid)
  .orderBy("dateKey", "asc")
  .get();
```

### 🎫 COUPONS Collection

```typescript
// Find coupon by code
const couponByCode = await db.collection("coupons")
  .where("code", "==", code)
  .orderBy("expiresAt", "desc")
  .limit(1)
  .get();

// Get active coupons
const activeCoupons = await db.collection("coupons")
  .where("active", "==", true)
  .orderBy("expiresAt", "desc")
  .get();

// Get coupons expiring soon
const expiringSoon = await db.collection("coupons")
  .where("active", "==", true)
  .orderBy("expiresAt", "asc")
  .limit(10)
  .get();
```

### 🎯 OFFERS Collection

```typescript
// Get active offers
const activeOffers = await db.collection("offers")
  .where("active", "==", true)
  .orderBy("startsAt", "desc")
  .get();

// Get upcoming offers
const upcomingOffers = await db.collection("offers")
  .where("active", "==", false)
  .orderBy("startsAt", "asc")
  .get();

// Get current offers (active and started)
const currentOffers = await db.collection("offers")
  .where("active", "==", true)
  .where("startsAt", "<=", new Date())
  .orderBy("startsAt", "desc")
  .get();
```

### 🍕 MENU ITEMS Collection

```typescript
// Get menu items by category
const categoryItems = await db.collection("menuItems")
  .where("category", "==", cat)
  .orderBy("name", "asc")
  .get();

// Get available menu items
const availableItems = await db.collection("menuItems")
  .where("available", "==", true)
  .orderBy("updatedAt", "desc")
  .get();

// Get menu items by category and availability
const availableCategoryItems = await db.collection("menuItems")
  .where("category", "==", "mains")
  .where("available", "==", true)
  .orderBy("name", "asc")
  .get();
```

### 📅 EVENTS Collection

```typescript
// Get events by location
const locationEvents = await db.collection("events")
  .where("locationId", "==", lid)
  .orderBy("startsAt", "asc")
  .get();

// Get upcoming events
const upcomingEvents = await db.collection("events")
  .where("startsAt", ">=", new Date())
  .orderBy("startsAt", "asc")
  .get();

// Get events for specific location and date range
const locationDateEvents = await db.collection("events")
  .where("locationId", "==", locationId)
  .where("startsAt", ">=", startDate)
  .where("startsAt", "<=", endDate)
  .orderBy("startsAt", "asc")
  .get();
```

## 🔍 Advanced Query Patterns

### Pagination with Cursor

```typescript
// First page
const firstPage = await db.collection("orders")
  .where("status", "==", "completed")
  .orderBy("createdAt", "desc")
  .limit(20)
  .get();

// Next page using last document as cursor
const lastDoc = firstPage.docs[firstPage.docs.length - 1];
const nextPage = await db.collection("orders")
  .where("status", "==", "completed")
  .orderBy("createdAt", "desc")
  .startAfter(lastDoc)
  .limit(20)
  .get();
```

### Count Queries (Firestore v9+)

```typescript
import { getCountFromServer } from "firebase/firestore";

// Count pending catering requests
const pendingCount = await getCountFromServer(
  db.collection("cateringRequests")
    .where("status", "==", "pending")
);
console.log("Pending requests:", pendingCount.data().count);
```

### Batch Operations

```typescript
// Batch write for multiple updates
const batch = db.batch();

// Update multiple orders
orderIds.forEach(orderId => {
  const orderRef = db.collection("orders").doc(orderId);
  batch.update(orderRef, { status: "shipped" });
});

await batch.commit();
```

## 📝 Query Optimization Tips

1. **Always use indexed fields** - Ensure your queries match the indexes in `firestore.indexes.json`
2. **Limit results** - Use `.limit()` to prevent large data transfers
3. **Use cursors for pagination** - More efficient than offset-based pagination
4. **Order by indexed fields** - Sorting requires composite indexes for filtered queries
5. **Avoid array-contains with orderBy** - This combination requires special indexes
6. **Use single-field indexes** - For simple equality queries on frequently accessed fields

## ⚠️ Common Pitfalls

- **Missing composite indexes** - Filtering + ordering requires composite indexes
- **Case sensitivity** - Firestore queries are case-sensitive, normalize data
- **Array queries** - `array-contains` and `array-contains-any` have limitations
- **OR queries** - Use `in` operator or multiple queries with client-side merging
- **Deep field queries** - Nested field queries (like `customer.email`) need proper indexing

## 🔗 Related Files

- `firestore.indexes.json` - Index definitions
- `src/lib/firestoreSafe.ts` - Safety wrapper for queries
- `firestore.rules` - Security rules