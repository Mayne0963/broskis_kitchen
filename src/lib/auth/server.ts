import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false as const, reason: "unauthenticated", session: null };
  }
  // you normalize to lowercase everywhere
  return { ok: true as const, uid: session.user.email.toLowerCase(), session };
}