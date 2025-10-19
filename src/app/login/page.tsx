"use client";
import { fbAuth } from "../../../firebase/client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function Login() {
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    try {
      setBusy(true);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(fbAuth, provider);
      const idToken = await cred.user.getIdToken(true); // force refresh
      await signIn("credentials", { idToken, callbackUrl: "/", redirect: true });
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed. Check console.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={handleLogin}
        disabled={busy}
        className="border px-3 py-2 rounded disabled:opacity-60"
      >
        {busy ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}