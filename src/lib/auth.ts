import { onAuthStateChanged, onIdTokenChanged, getIdToken, getIdTokenResult } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import type { Role } from '@/context/RoleContext';

export function subscribeToAuth(setRole: (r: Role) => void) {
  let forced = false;
  
  const read = async (force = false) => {
    const u = auth.currentUser;
    if (!u) return setRole(null);
    
    if (force) await getIdToken(u, true);
    const r = await getIdTokenResult(u);
    setRole((r.claims.role as Role) ?? null);
  };
  
  const u1 = onAuthStateChanged(auth, async (u) => {
    if (!u) return setRole(null);
    await read(false);
  });
  
  const u2 = onIdTokenChanged(auth, async () => {
    await read(false);
  });
  
  setTimeout(async () => {
    if (!forced && auth.currentUser) {
      forced = true;
      await read(true);
    }
  }, 1500);
  
  return () => {
    u1();
    u2();
  };
}