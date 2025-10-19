import { getServerUser } from "@/lib/session";

export async function getUserIdOrNull() {
  const user = await getServerUser();
  return user?.uid ?? null;
}