"use client";
import Link from "next/link";
export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Link href="/account/profile" className="btn btn-outline">View Profile</Link>
      <Link href="/account/orders" className="btn btn-outline">View Orders</Link>
    </div>
  );