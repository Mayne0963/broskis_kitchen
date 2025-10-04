export type Role = "admin" | "user";

export function normalizeRole(input?: string | null): Role {
  const r = (input ?? "user").toLowerCase();
  return r === "admin" ? "admin" : "user";
}

export function isAdmin(role?: string | null) {
  return normalizeRole(role) === "admin";
}