# Admin Dashboard Live Update Flow

The admin dashboard combines real-time Firestore listeners with SWR revalidation to keep data fresh.

## Firestore listeners
- `useAdminData` sets up `onSnapshot` listeners for:
  - `orders`
  - `menuDrops`
  - `userRedemptions`
  - `users`
- When any of these collections change, the hook calls `fetchAdminData()` which reads the latest documents and recomputes dashboard stats.
- The hook exposes `data`, loading state, errors, and a `refetch` method.

## SWR metrics
- `page.tsx` uses SWR to load `/api/admin/metrics` with a 5s refresh interval.
- A Firestore listener on today's `orders` calls `mutate()` to force SWR to revalidate and `refetch()` to refresh `useAdminData`.

## Dashboard updates
- `AdminDashboard` receives `adminData`, `metricsData`, and `refetch`.
- As Firestore events occur or SWR refreshes, the component rerenders with new data, providing live updates to admins.