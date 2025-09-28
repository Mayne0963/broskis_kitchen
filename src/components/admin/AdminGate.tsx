"use client";
import { useSession, signIn } from "next-auth/react";

const ALLOWED = (process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const u: any = data?.user;
  const ok = u && (u.isAdmin || ALLOWED.includes(u.email));

  if (status === "loading") {
    return (
      <div className="p-6 text-slate-300">
        Checking…
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="p-6 text-slate-200">
        <p>Admin only.</p>
        <button 
          onClick={() => signIn()} 
          className="mt-3 px-4 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  return <>{children}</>;
}