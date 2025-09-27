import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * Safely retrieves the user ID from the current server session.
 * Returns null if no session exists or user ID is not available.
 */
export async function getUserIdOrNull(): Promise<string | null> {
  const session = await getServerSession(authOptions as any);
  return session?.user?.id ?? null;
}