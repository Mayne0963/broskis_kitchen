"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { isUserAdmin } from "@/lib/auth/roleUtils";

export default function AdminCateringCTA() {
  const { data, status } = useSession();
  const isAdmin = isUserAdmin(data?.user);

  if (status === "loading") return null; // no flicker / no crash
  if (!isAdmin) return null;

  return (
    <div className="bg-slate-900/30 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-end">
        <Link 
          href="/admin/catering"
          className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:bg-yellow-400 hover:scale-105"
        >
          Admin Catering
        </Link>
      </div>
    </div>
  );
}