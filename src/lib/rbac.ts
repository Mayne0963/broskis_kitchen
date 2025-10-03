import { isUserAdmin } from "./auth/roleUtils";

export type Role = "admin" | "manager" | "staff" | "customer";

export const isAdmin = (role?: string) => isUserAdmin(role);
