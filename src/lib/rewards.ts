import { dbAdmin } from "@/lib/firebase/admin";

export async function getOrCreateRewardsProfile(uid: string) {
  const ref = dbAdmin.collection("rewardsProfiles").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() || {};
    // guarantee required fields exist
    const profile = {
      uid,
      points: Number(data.points ?? 0),
      lifetimePoints: Number(data.lifetimePoints ?? 0),
      tier: (data.tier ?? "bronze").toString(),
      createdAt: Number(data.createdAt ?? Date.now()),
      updatedAt: Number(data.updatedAt ?? Date.now()),
      referralCode: data.referralCode,
      referredBy: data.referredBy,
      birthday: data.birthday,
      streak: data.streak,
    };
    return { profile, created: false };
  }

  const now = Date.now();
  const profile = {
    uid, points: 0, lifetimePoints: 0, tier: "bronze",
    createdAt: now, updatedAt: now,
  };
  await ref.set(profile, { merge: true });
  return { profile, created: true };
}

export async function getLastTransactions(uid: string, limit = 25) {
  const q = await dbAdmin.collection("rewardsTransactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}