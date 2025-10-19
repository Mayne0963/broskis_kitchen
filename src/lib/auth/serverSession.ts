import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function getUserIdOrNull() {
  const s = await getServerSession(authOptions as any);
  return s?.user?.id ?? null;
}