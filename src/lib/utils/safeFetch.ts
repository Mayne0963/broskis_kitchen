export async function safeFetch(input: RequestInfo, init?: RequestInit) {
  try {
    // Always include credentials so cookies like `__session` are sent
    const res = await fetch(input, { credentials: 'include', ...init });
    return res;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('safeFetch error:', e);
    // Propagate network failures with a synthetic 0 status
    return new Response(null as any, { status: 0 });
  }
}