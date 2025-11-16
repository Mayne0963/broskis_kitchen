import 'dotenv/config'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const limitArg = args.find(a => a.startsWith('--limit='))
  const limit = Math.min(500, Number(limitArg?.split('=')[1] ?? 200))

  let processed = 0
  let updated = 0
  let skipped = 0
  const errors: Array<{ id: string; reason: string }> = []

  const q = adminDb
    .collection('orders')
    .where('userEmail', '!=', '')
    .orderBy('userEmail')
    .limit(limit)

  const snap = await q.get()
  for (const doc of snap.docs) {
    processed++
    const o = doc.data() as any
    const id = doc.id
    const email = o.userEmail
    const hasUid = !!o.userId
    if (!email || hasUid) { skipped++; continue }
    try {
      const user = await adminAuth.getUserByEmail(email)
      if (!user?.uid) { skipped++; continue }
      if (apply) {
        await adminDb.collection('orders').doc(id).update({ userId: user.uid })
        try {
          await adminDb.collection('users').doc(user.uid).collection('orders').doc(id).set({ ...o, userId: user.uid }, { merge: true })
        } catch {}
      }
      updated++
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[backfill] ${id} -> ${user.uid}`)
      }
    } catch (e: any) {
      errors.push({ id, reason: String(e?.message || e) })
    }
  }

  console.log(JSON.stringify({ apply, processed, updated, skipped, errors }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})