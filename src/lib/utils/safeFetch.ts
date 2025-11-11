export async function safeFetch(input: RequestInfo, init?: RequestInit) {
  // Merge headers and attach App Check token when available
  const headers = new Headers(init?.headers || {});
  try {
    if (typeof window !== 'undefined') {
      // Attach App Check header if token can be retrieved
      try {
        const { getAppCheck, getToken } = await import('firebase/app-check');
        const appCheck = getAppCheck();
        const tokenResult = await getToken(appCheck, false);
        const token = tokenResult?.token;
        if (token) headers.set('X-Firebase-AppCheck', token);
      } catch (e) {
        // Swallow App Check failures; continue without header
        if (process.env.NODE_ENV !== 'production') console.warn('safeFetch AppCheck:', e);
      }
    }

    // Always include credentials so cookies like `__session` are sent
    const res = await fetch(input, { credentials: 'include', ...init, headers });
    return res;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('safeFetch error:', e);
    // Propagate network failures with a synthetic 0 status
    return new Response(null as any, { status: 0 });
  }
}