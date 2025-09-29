"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const [serverOK, setServerOK] = useState<boolean | null>(null);
  
  // Client hint: allowed emails (optional convenience), normalized
  const allowed = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS || "";
    return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  }, []);
  
  const email = (data?.user?.email || "").toLowerCase();
  const clientOK = !!data?.user && (
    // prefer explicit flag if your session sets it
    (data as any)?.user?.isAdmin === true ||
    // fallback to env allow list
    (allowed.length > 0 && allowed.includes(email))
  );
  
  // Server truth: try a lightweight admin ping
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/admin/catering/list?limit=1", { method: "GET" })
      .then(r => setServerOK(r.ok))
      .catch(() => setServerOK(false));
  }, [status]);
  
  if (status === "loading") return <div className="p-10 text-slate-300">Checking…</div>;
  
  // If not logged in
  if (!data?.user) {
    return (
      <div className="p-10 text-slate-200">
        <p>Admin only.</p>
        <button onClick={() => signIn()} className="mt-3 px-4 py-2 rounded bg-yellow-500 text-black">Sign in</button>
      </div>
    );
  }
  
  // If server confirmed (200) OR client rules pass, allow
  if (serverOK === true || clientOK) return <>{children}</>;
  
  // If server explicitly denied (403), block
  if (serverOK === false) {
    return (
      <div className="p-10 text-slate-200">
        <p>Access denied for {email || "your account"}.</p>
        <p className="text-slate-400 text-sm mt-2">Ask an existing admin to add your email to NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS or set user.isAdmin in the NextAuth session callback.</p>
      </div>
    );
  }
  
  // Waiting on server check
  return <div className="p-10 text-slate-300">Verifying admin…</div>;
}