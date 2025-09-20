"use client";

import { getAuth } from "firebase/auth";
import { safeFetch } from "@/lib/utils/safeFetch";

export async function establishSessionCookie() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return false;

  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const res = await safeFetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });
  return res.ok;
}

export async function clearSessionCookie() {
  await safeFetch("/api/session", {
    method: "DELETE",
    credentials: "include"
  });
}