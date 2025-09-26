import { redirect } from 'next/navigation';
import { admin } from '@/lib/firebase';
import { getServerUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

type BalanceDoc = {
  points?: number;
  nextSpinUTC?: string | null;
  expiringSoon?: Array<{ points: number; expiresAt: number }>;
};

type CatalogItem = {
  id: string;
  title: string;
  pointsRequired: number;
  description?: string;
  imageUrl?: string;
};

async function loadBalance(uid: string) {
  const db = admin.firestore();
  const snap = await db.collection('rewards_balances').doc(uid).get();
  const data = (snap.exists ? (snap.data() as BalanceDoc) : {}) || {};
  return {
    points: Number(data.points ?? 0),
    nextSpinUTC: data.nextSpinUTC ?? null,
    expiringSoon: Array.isArray(data.expiringSoon) ? data.expiringSoon : [],
  };
}

async function loadCatalog(): Promise<CatalogItem[]> {
  const db = admin.firestore();
  const snap = await db.collection('rewards_catalog').get();

  return snap.docs.map(
    (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
      const v = doc.data() as Record<string, any>;
      return {
        id: doc.id,
        title: String(v.title ?? 'Reward'),
        // ✅ fix typo: pointsRequired (not pointRequired)
        pointsRequired: Number(v.pointsRequired ?? 0),
        description: v.description ? String(v.description) : '',
        imageUrl: v.imageUrl ? String(v.imageUrl) : '',
      };
    }
  );
}

export default async function RewardsPage() {
  // ✅ Auth: user required, but NOT admin-only
  const user = await getServerUser();
  if (!user) redirect('/login?next=/rewards');

  // No role checks here — any signed-in user can see rewards
  const [balance, catalog] = await Promise.all([
    loadBalance(user.uid),
    loadCatalog(),
  ]);

  return (
    <main className="rewards-page">
      {/* Summary */}
      <section className="summary">
        <h1 className="text-2xl">Rewards Program</h1>
        <div className="mt-2 flex gap-6">
          <div><strong>Available Points:</strong> {balance.points}</div>
          {balance.nextSpinUTC && (
            <div><strong>Next Daily Spin:</strong> {new Date(balance.nextSpinUTC).toUTCString()}</div>
          )}
        </div>
        {balance.expiringSoon?.length ? (
          <div className="mt-3">
            <strong>Expiring Soon:</strong>
            <ul className="list-disc pl-5">
              {balance.expiringSoon.map((e, i) => (
                <li key={i}>
                  {e.points} pts • expires {new Date(e.expiresAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Catalog (read-only) */}
      <section className="catalog mt-8">
        <h2 className="text-xl mb-3">Rewards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => {
            const canRedeem = balance.points >= c.pointsRequired;
            return (
              <div key={c.id} className="card rounded-lg border border-white/10 p-4 bg-black/30">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.title} className="w-full h-32 object-cover rounded-md mb-3" />
                ) : null}
                <div className="text-lg font-semibold">{c.title}</div>
                {c.description && <div className="text-sm opacity-80">{c.description}</div>}
                <div className="mt-2">
                  <span className="text-sm">Requires </span>
                  <strong>{c.pointsRequired} points</strong>
                </div>
                <button
                  disabled={!canRedeem}
                  className={`mt-3 px-3 py-2 rounded-md ${
                    canRedeem ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white/50 cursor-not-allowed'
                  }`}
                  aria-disabled={!canRedeem}
                  title={canRedeem ? 'Enough points to redeem' : 'Not enough points'}
                >
                  Redeem (coming soon)
                </button>
              </div>
            );
          })}
          {!catalog.length && (
            <div className="opacity-70">No rewards available yet. Check back soon.</div>
          )}
        </div>
      </section>
    </main>
  );
}
