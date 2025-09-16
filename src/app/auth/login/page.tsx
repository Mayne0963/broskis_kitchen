// Reuse the existing admin login page for user auth route.
// Minimal shim to satisfy links to /auth/login.
export { default } from "../../login/page";
export const dynamic = "force-dynamic";