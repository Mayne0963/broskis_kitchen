export async function safeFetch(input: RequestInfo, init?: RequestInit) {
  try {
    const res = await fetch(input, { credentials: "include", ...init });
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") console.warn("safeFetch non-OK:", res.status);
      // Return an empty JSON response to avoid crashing UIs that expect JSON
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return res;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("safeFetch error:", e);
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}