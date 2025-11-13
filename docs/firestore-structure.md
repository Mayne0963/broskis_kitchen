# Firestore Structure and Conventions

- Collections: lowercase, plural (e.g., `orders`, `rewardTransactions`).
- Document IDs: semantic IDs when natural; otherwise ULIDs.
- Fields: camelCase; enums as strings with constrained values.
- Ownership: `ownerId` on user-owned documents.
- Timestamps: `createdAt` and `updatedAt` on all mutable documents.
- Flattening: replace nested query fields (e.g., `customer.email`) with `customerEmail`.
- Versioning: add `schemaVersion` for migrated documents.

## Admin Separation
- Public database: user-facing collections.
- Admin database (`admin`): operational data (`adminLogs`, `idempotencyKeys`, `system_health`, `performance_metrics`).
- Client SDK never accesses the `admin` database.

