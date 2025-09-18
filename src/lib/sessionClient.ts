"use client";

import { getAuth } from "firebase/auth";

export async function establishSessionCookie() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return false;

  const idToken = await user.getIdToken(/* forceRefresh */ true);
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });
  return res.ok;
}

export async function clearSessionCookie() {
  await fetch("/api/session", {
    method: "DELETE",
    credentials: "include"
  });
}