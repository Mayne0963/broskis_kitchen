"use client";
import { useEffect, useState } from "react";

export default function RewardsClient({ initial }: { initial: any }) {
  const [state, setState] = useState(initial);

  // One retry on mount so devtools show precise API failure if any
  useEffect(() => {
    if (!initial?.ok) {
      (async () => {
        try {
          const r = await fetch("/api/rewards/me", { cache: "no-store" });
          const j = await r.json();
          setState(j);
          if (!j.ok) console.error("Rewards load failed:", j);
        } catch (e) {
          console.error("Rewards network error:", e);
        }
      })();
    }
  }, [initial]);

  if (!state?.ok) {
    const unauth = state?.reason === "unauthenticated";
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-1">Oops! Something went wrong</h2>
          <p className="text-white/70">
            {unauth
              ? "Please sign in to view your rewards."
              : "We couldn't load your rewards right now. Please try again."}
          </p>
          <div className="mt-4 flex gap-3">
            <button className="btn-primary" onClick={() => location.reload()}>Try Again</button>
            {unauth && <a className="btn-ghost underline" href="/login">Go to Login</a>}
          </div>
        </div>
      </div>
    );
  }

  const { profile, transactions = [] } = state;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">Your Rewards</h1>
        <p className="text-white/70">
          Balance: <b>{profile.points}</b> · Lifetime: {profile.lifetimePoints} · Tier: {profile.tier}
        </p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-2">History</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm" role="table" aria-label="Rewards history">
            <thead className="sticky top-0 bg-black/50 border-b border-white/10">
              <tr className="[&>th]:text-left [&>th]:py-2 [&>th]:px-3 text-white/60 uppercase text-xs">
                <th>Date</th><th>Type</th><th>Source</th><th>Delta</th><th>Balance</th><th>Note</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id} className="border-b border-white/10">
                  <td className="py-2 px-3">{new Date(t.createdAt).toLocaleString()}</td>
                  <td className="px-3">{t.type}</td>
                  <td className="px-3">{t.source}</td>
                  <td className="px-3">{t.delta > 0 ? `+${t.delta}` : t.delta}</td>
                  <td className="px-3">{t.balanceAfter}</td>
                  <td className="px-3">{t.meta?.note || t.meta?.orderId || "—"}</td>
                </tr>
              ))}
              {!transactions.length && (
                <tr><td colSpan={6} className="py-6 text-center text-white/60">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}