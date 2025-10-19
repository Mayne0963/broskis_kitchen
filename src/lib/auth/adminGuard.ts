import { getServerUser } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function assertAdmin() {
  const user = await getServerUser();
  const userIsAdmin = isAdmin(user?.roles?.[0]);
  
  if (!user || !userIsAdmin) {
    throw new Error("FORBIDDEN");
  }
  
  return user;
}