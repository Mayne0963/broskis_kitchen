# Firestore Indexes and Purpose

- `users(role ASC, createdAt DESC)`: admin user management by role and recency.
- `users(role ASC, email ASC)`: admin search and filtering by role and email.
- `cateringRequests(status ASC, createdAt DESC)`: filter requests by status and time.
- `cateringRequests(customer.email ASC, createdAt DESC)`: legacy email filter.
- `cateringRequests(customerEmail ASC, createdAt DESC)`: flattened email filter for faster reads.
- `orders(userId ASC, createdAt DESC)`: user order history.
- `orders(status ASC, createdAt DESC)`: admin views by order status.
- `rewards(userId ASC, createdAt DESC)`: user rewards activity timeline.
- `rewardRedemptions(userId ASC, createdAt DESC)`: redemption history by user.
- `spins(userId ASC, createdAt DESC)`: spin history by user.
- `spins(userId ASC, dateKey ASC)`: daily spin lookups.
- `coupons(code ASC, expiresAt DESC)`: coupon validation and expiry sorting.
- `offers(active ASC, startsAt DESC)`: active offers by start date.
- `menuItems(category ASC, name ASC)`: browse by category and name.
- `menuItems(available ASC, updatedAt DESC)`: availability views.
- `events(locationId ASC, startsAt ASC)`: events timeline per location.

