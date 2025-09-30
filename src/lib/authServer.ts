import { cookies, headers } from "next/headers";
import { adminAuth } from "./firebase/admin";

export async function getServerUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value || cookieStore.get("session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { uid: decoded.uid, email: decoded.email || null, role: (decoded as any).role || "customer" };
  } catch {
    return null;
  }
}