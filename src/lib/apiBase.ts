// src/lib/apiBase.ts
export const API_BASE =
  (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "") as string;