import { onAuthStateChanged, onIdTokenChanged, getIdToken, getIdTokenResult } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import type { Role } from '@/context/RoleContext';

export function subscribeToAuth(onRole: (r: Role) => void) {
  let forced = false;
  const readClaims = async (force = false) => {
    const u = auth.currentUser;
    if (!u) return onRole(null);
    if (force) await getIdToken(u, true);
    const res = await getIdTokenResult(u);
    onRole((res.claims.role as Role) ?? null);
  };
  const unsub1 = onAuthStateChanged(auth, async (u) => {
    if (!u) return onRole(null);
    await readClaims(false);
  });
  const unsub2 = onIdTokenChanged(auth, async () => {
    await readClaims(false);
  });
  setTimeout(async () => {
    if (!forced && auth.currentUser) { forced = true; await readClaims(true); }
  }, 1500);
  return () => { unsub1(); unsub2(); };
}