# Firestore Security Rules Summary

- Roles: `admin`, `staff`, `user` via custom claims.
- Helpers: `isSignedIn`, `isAdmin`, `isStaff`, `isSelf(uid)`.

## users
- Read/Write: self or admin.

## orders
- Read: owner, admin, or staff.
- Create: signed-in owner with required fields (`ownerId`, `status`, `createdAt`).
- Update: owner limited to `status`, `updatedAt`; admin/staff unrestricted.
- Delete: admin only.

## rewards profiles/transactions
- Read: owner or admin.
- Write: server/admin only; history immutable.

## referrals and tracking
- Read: participants or admin.
- Write: server-only; immutable records.

## offers and menuDrops
- Read: authenticated users.
- Write: admin.

## idempotencyKeys
- Deny all to clients; server-only.

## Default
- Deny all unspecified collections.

