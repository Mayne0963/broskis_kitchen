"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-semibold text-white/90">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button asChild variant="outline" className="rounded-2xl border-[#FFD700] text-white bg-black hover:bg-[#121212]">
          <Link href="/account/profile">View Profile</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl border-[#FFD700] text-white bg-black hover:bg-[#121212]">
          <Link href="/account/orders">View Orders</Link>
        </Button>
      </div>
    </section>
  );
}