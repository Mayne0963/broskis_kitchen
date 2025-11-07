"use client";

import { getAuth } from "firebase/auth";
import { authFetch } from "@/lib/utils/authFetch";

export async function establishSessionCookie() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return false;

  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const res = await authFetch("/api/auth/session-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });
  return res.ok;
}

export async function clearSessionCookie() {
  await authFetch("/api/auth/session-logout", {
    method: "DELETE",
    credentials: "include"
  });
}