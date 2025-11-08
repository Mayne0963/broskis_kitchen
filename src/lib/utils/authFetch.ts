import { authLogger } from '@/lib/utils/authLogger';

export type AuthFetchOptions = RequestInit & {
  retryOn401?: boolean;
};

// Simple in-memory refresh deduplication to avoid race conditions
let refreshInFlight: Promise<boolean> | null = null;
let concurrentRefreshes = 0;

async function performRefresh(): Promise<boolean> {
  const startedAt = Date.now();
  authLogger.refreshStart('401', concurrentRefreshes);
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
      } catch (e) {
        authLogger.error('authFetch/firebase', 'Failed to access firebase auth', e);
      }
    }

    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(idToken ? { idToken } : {}),
    });
    const ok = res.ok;
    authLogger.refreshEnd(ok, startedAt);
    return ok;
  } catch (e: any) {
    authLogger.error('authFetch/refresh', e?.message || 'Refresh failed', e);
    authLogger.refreshEnd(false, startedAt);
    return false;
  }
}

// Centralized fetch that sends credentials and handles 401 by refreshing once (deduped)
export async function authFetch(input: RequestInfo, init: AuthFetchOptions = {}) {
  const opts: RequestInit = {
    credentials: 'include',
    cache: init.cache ?? 'no-store',
    ...init,
  };

  const id = authLogger.nextRequestId();
  const startedAt = Date.now();
  const url = typeof input === 'string' ? input : (input as Request).url;
  authLogger.requestStart(id, url, (opts as any).method);

  let res = await fetch(input, opts);
  authLogger.requestEnd(id, url, res.status, startedAt);

  if (res.status === 401 && (init.retryOn401 ?? true)) {
    // Deduplicate refreshes
    if (!refreshInFlight) {
      concurrentRefreshes = 1;
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
        concurrentRefreshes = 0;
      });
    } else {
      concurrentRefreshes += 1;
    }

    const ok = await refreshInFlight;
    if (ok) {
      // One retry after refresh
      const retryStart = Date.now();
      const retryId = authLogger.nextRequestId();
      authLogger.requestStart(retryId, url, (opts as any).method);
      res = await fetch(input, { ...opts, cache: 'no-store' });
      authLogger.requestEnd(retryId, url, res.status, retryStart);
    }
  }

  return res;
}