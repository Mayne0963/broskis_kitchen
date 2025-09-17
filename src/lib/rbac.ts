export type Role = "admin" | "manager" | "staff" | "customer";

export const isAdmin = (role?: string) => role === "admin" || role === "manager";