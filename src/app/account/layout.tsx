import * as React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] w-full bg-broski-black text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            <span className="text-broski-gold">Broski's</span> Account
          </h1>
          <p className="text-white/70">Your orders, profile, and rewards — all in one place.</p>
        </header>
        {children}
      </div>
    </div>
  );
}