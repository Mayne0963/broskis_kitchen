import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

const ALLOW = (process.env.ALLOWED_ADMIN_EMAILS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export async function assertAdmin() {
  const s = await getServerSession(authOptions as any);
  const isAdmin = (s as any)?.user?.isAdmin || (ALLOW.includes((s as any)?.user?.email));
  
  if (!s || !isAdmin) {
    throw new Error("FORBIDDEN");
  }
  
  return (s as any).user;
}