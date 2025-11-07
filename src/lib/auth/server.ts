import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSessionCookie } from "@/lib/auth/session";

export async function requireUser() {
  // Prefer Firebase session cookie when available
  const cookieUser = await getSessionCookie();
  if (cookieUser?.uid) {
    return { ok: true as const, uid: cookieUser.uid, session: null };
  }

  // Fallback to NextAuth session
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, reason: "unauthenticated", session: null };
  }
  return { ok: true as const, uid: (session.user.email || "").toLowerCase(), session };
}