"use client";
import Link from "next/link";
import { useSession } from "../hooks/useSession";
import { isAdmin } from "../lib/roles";

export default function AdminButton() {
  const { user, isLoading } = useSession();
  if (isLoading) return null; // avoid flicker
  if (!isAdmin(user?.role)) return null;
  return (
    <Link
      href="/admin/catering"
      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border"
    >
      Admin Catering
    </Link>
  );
}