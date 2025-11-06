"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInForwarder() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const callbackUrl = search.get("callbackUrl") || "/dashboard";
    const next = encodeURIComponent(callbackUrl);
    router.replace(`/auth/login?next=${next}`);
  }, [router, search]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Redirecting to sign in…</h1>
        <p className="text-slate-400">If you are not redirected, <a href="/auth/login" className="underline">click here</a>.</p>
      </div>
    </div>
  );
}