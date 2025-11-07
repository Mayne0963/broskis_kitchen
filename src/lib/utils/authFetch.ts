export type AuthFetchOptions = RequestInit & {
  retryOn401?: boolean;
};

// Centralized fetch that sends credentials and handles 401 by refreshing once
export async function authFetch(input: RequestInfo, init: AuthFetchOptions = {}) {
  const opts: RequestInit = { credentials: 'include', ...init };
  let res = await fetch(input, opts);

  if (res.status === 401 && (init.retryOn401 ?? true)) {
    try {
      // Try to get a fresh ID token from Firebase client when available
      let idToken: string | undefined;
      if (typeof window !== 'undefined') {
        try {
          const { getAuth } = await import('firebase/auth');
          const currentUser = getAuth().currentUser;
          if (currentUser) {
            idToken = await currentUser.getIdToken(true);
          }
        } catch {
          // Firebase not available client-side; continue without idToken
        }
      }

      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(idToken ? { idToken } : {})
      });

      if (refreshRes.ok) {
        res = await fetch(input, { ...opts, cache: 'no-store' });
      }
    } catch (e) {
      // swallow and return original 401
    }
  }

  return res;
}