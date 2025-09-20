export async function safeFetch(input: RequestInfo, init?: RequestInit) {
  try {
    const res = await fetch(input, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("safeFetch error:", e);
    return new Response(null, { status: 520 });
  }
}