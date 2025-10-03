import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * Auth wrapper for getServerSession
 * Provides consistent server-side authentication
 */
export async function auth() {
  return await getServerSession(authOptions);
}