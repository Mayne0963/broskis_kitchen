"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [serverOK, setServerOK] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/check", { method: "GET" })
      .then(res => setServerOK(res.ok))
      .catch(() => setServerOK(false));
  }, [status]);

  if (status === "loading") return <div className="p-6 text-slate-200">Loading…</div>;

  if (!session?.user) {
    return (
      <div className="p-6 text-slate-200">
        <p>Admin only.</p>
        <button onClick={() => signIn()} className="bg-yellow-500 px-4 py-2 rounded mt-2">Sign in</button>
      </div>
    );
  }

  const email = (session.user.email || "").toLowerCase();
  const allowed = (process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS || "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const clientOK = (session as any).user?.isAdmin || allowed.includes(email);

  if (serverOK === true || clientOK) return <>{children}</>;

  if (serverOK === false) {
    return <div className="p-6 text-red-400">Access denied for {email}.</div>;
  }

  return <div className="p-6 text-slate-200">Verifying…</div>;
}