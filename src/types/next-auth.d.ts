import { DefaultSession } from "next-auth";
declare module "next-auth" {
  interface Session {
    user: { id?: string; role?: "admin" | "user" } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "user";
    lastRoleCheck?: number;
    email?: string;
  }
}