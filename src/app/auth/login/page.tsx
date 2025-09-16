// Client component: Customer Login (email/password)
"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Login failed (${res.status})`);
      }
      // success: redirect to previous page or profile
      const next = typeof window !== "undefined" && sessionStorage.getItem("afterLogin") || "/profile";
      window.location.assign(next);
    } catch (err:any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Sign in to your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-black/30 px-3 py-2 outline-none"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-black/30 px-3 py-2 outline-none"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-yellow-500 px-4 py-2 font-medium text-black hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-400">
        Don't have an account?{" "}
        <Link href="/auth/register" className="text-yellow-400 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}

export const dynamic = "force-dynamic";