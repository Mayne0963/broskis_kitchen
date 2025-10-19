import { getServerUser } from "@/lib/session";

export async function requireUser() {
  const user = await getServerUser();
  if (!user?.email) {
    return { ok: false as const, reason: "unauthenticated", session: null };
  }
  // you normalize to lowercase everywhere
  return { ok: true as const, uid: user.email.toLowerCase(), session: user };
}