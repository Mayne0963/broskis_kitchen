export async function safeFetch(input: RequestInfo, init?: RequestInit) {
  try {
    const res = await fetch(input, init);
    if (!res.ok) throw new Error(String(res.status));
    return res;
  } catch {
    if (process.env.NODE_ENV !== "production") console.warn("safeFetch error");
    return new Response(null, { status: 520 });
  }
}