# Firestore Performance Benchmarks

- Scope: hot queries (orders by user, rewards by user, catering by status/email).
- Method: measure median and 95th percentile latency before/after optimization.
- Environment: emulator and production; record region and load.
- Storage: write metrics to `performance_metrics` and system health to `system_health`.
- Result: include charts and deltas per query shape.

