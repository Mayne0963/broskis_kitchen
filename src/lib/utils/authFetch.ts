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
  // Prepare headers and attach App Check token when available
  const baseHeaders = new Headers(init.headers || {});
  try {
    if (typeof window !== 'undefined') {
      const { getAppCheck, getToken } = await import('firebase/app-check');
      const appCheck = getAppCheck();
      const tokenResult = await getToken(appCheck, false);
      const token = tokenResult?.token;
      if (token) baseHeaders.set('X-Firebase-AppCheck', token);
    }
  } catch (e) {
    // Non-fatal; continue without App Check header
  }

  const opts: RequestInit = {
    credentials: 'include',
    cache: init.cache ?? 'no-store',
    ...init,
    headers: baseHeaders,
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
      // Refresh App Check token for retry attempt
      const retryHeaders = new Headers(baseHeaders);
      try {
        if (typeof window !== 'undefined') {
          const { getAppCheck, getToken } = await import('firebase/app-check');
          const appCheck = getAppCheck();
          const tokenResult = await getToken(appCheck, true);
          const token = tokenResult?.token;
          if (token) retryHeaders.set('X-Firebase-AppCheck', token);
        }
      } catch {}

      res = await fetch(input, { ...opts, cache: 'no-store', headers: retryHeaders });
      authLogger.requestEnd(retryId, url, res.status, retryStart);
    }
  }

  return res;
}