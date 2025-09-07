# TODO:

- [x] 1: Verify and validate all required Firebase environment variables (priority: High)
- [x] 2: Create lib/firebase/client.ts for public Firebase reads (priority: High)
- [x] 3: Create lib/firebase/admin.ts with Admin SDK configuration (priority: High)
- [x] 4: Create lib/auth/adminOnly.ts for server-only auth gate (priority: High)
- [x] 5: Set up Firestore collections with proper schemas (orders, users, pointsTransactions, coupons, offers) (priority: High)
- [x] 11: Create Firestore composite indexes and security rules (priority: High)
- [x] 12: Wire admin dashboard components to use new API endpoints instead of direct Firestore reads (priority: High)
- [x] 6: Create secure API endpoints: GET /api/admin/orders with filtering and pagination (priority: Medium)
- [x] 7: Create GET /api/admin/users with search and pagination (priority: Medium)
- [x] 8: Create GET /api/admin/rewards/:userId/summary endpoint (priority: Medium)
- [x] 9: Create GET /api/admin/coupons and POST /api/admin/coupons endpoints (priority: Medium)
- [x] 10: Create GET /api/admin/offers endpoint with filtering (priority: Medium)
