"use client";
import { fbAuth } from "../../../firebase/client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setBusy(true);
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(fbAuth, provider);
      const idToken = await cred.user.getIdToken(true); // force refresh
      
      // Create session cookie using Firebase Auth
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        throw new Error('Failed to create session');
      }
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