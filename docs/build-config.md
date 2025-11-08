# Build Configuration Notes

- Vercel region: `iad1` (Washington, D.C.). Machine: 2 cores, 8 GB RAM.
- Package manager pinned via `packageManager: pnpm@10.9.0`.
- pnpm build scripts approvals managed through `pnpm-workspace.yaml`:
  - `onlyBuiltDependencies`: sharp, esbuild, @swc/core, protobufjs, @sentry/cli, unrs-resolver
  - `ignoredBuiltDependencies`: @firebase/util
  - `strictDepBuilds: false` (CI will not fail on unapproved builds)
- Husky installed as devDependency and prepare script guards against missing installation in CI.
- Deprecated `node-domexception@1.0.0` warning is benign; we do not import it directly. If it causes issues, override or dedupe to platform `DOMException`.