"use client";
import { useAuth } from "@/lib/context/AuthContext";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";

const LuxuryWheel = dynamic(() => import("@/components/rewards/LuxuryWheel"), { ssr: false });

export default function AuthGate() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return <div className="h-64 flex items-center justify-center text-slate-300">Loading…</div>;
  }

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-slate-300">Checking account…</div>;
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <h2 className="text-2xl font-semibold text-yellow-300">Sign in to access Broski Rewards</h2>
        <p className="text-slate-400 text-center max-w-md">
          Join the Broski community to earn points, spin the wheel, and unlock exclusive rewards!
        </p>
        <Link 
          href="/auth/login" 
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold shadow hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid gap-10">
      {/* Keep your existing rewards header/points/claim panels exactly as-is.
         Only replace the area where the broken "spin" button was with <LuxuryWheel/> */}
      <LuxuryWheel />
    </div>
  );
}