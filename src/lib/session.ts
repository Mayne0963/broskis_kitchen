import { getServerUser as getAuthServerUser, type ServerUser } from "@/lib/authServer";

export type AppUser = ServerUser;

export async function getServerUser(): Promise<AppUser | null> {
  return await getAuthServerUser();
}
