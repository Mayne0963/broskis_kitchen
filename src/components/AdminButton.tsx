"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminButton() {
  const { data: session, status } = useSession();
  if (status === "loading") return null; // avoid flicker
  if (session?.user?.role !== "ADMIN") return null;
  return (
    <Link
      href="/admin/catering"
      className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border"
    >
      Admin Catering
    </Link>
  );
}