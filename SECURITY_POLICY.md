# Admin Secrets & Allowlist Security Policy

This document defines controls for `ADMIN_SETUP_SECRET` and `ADMIN_EMAIL_ALLOWLIST`.

## ADMIN_SETUP_SECRET
- Generate using a cryptographically secure random string of at least 64 characters.
- Store in environment variables or secrets manager only; never commit to code.
- Rotate every 90 days or upon suspected breach.
- Rotation steps:
  1. Generate new secret (`npm run secret:generate`).
  2. Update environment in all systems (local, CI, Vercel).
  3. Invalidate previous secret immediately.
  4. Notify authorized administrators of the change.
  5. Document rotation in security logs.

## ADMIN_EMAIL_ALLOWLIST
- Only verified admin emails allowed (format `user@domain.com`).
- Verification required before adding: send confirmation link and mark `verified=true` in Firestore collection `security_admin_allowlist/{email}`.
- Access controls: only privileged admin system can write; route requires bearer secret.
- Never store the allowlist in code; use Firestore. Optional env fallback for emergency only.

## Version Control Protection
- `.env*` ignored via `.gitignore`.
- Husky pre-commit hook blocks committing env/secrets files.
- Sensitive identifiers flagged during commit; values must come from environment.

## Operations
- Maintain audit logs for allowlist changes and secret rotations.
- Document incidents; review access quarterly.