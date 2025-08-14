import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebaseAdmin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    await initAdmin();
    const { uid, role } = req.body;

    if (!uid || !role) {
      return res.status(400).json({ error: 'Missing uid or role' });
    }

    // TODO: Add proper authentication check here
    // For now, this endpoint should only be accessible by existing admins
    // In production, verify the requesting user has admin privileges

    await getAuth().setCustomUserClaims(uid, { role });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error setting custom claims:', e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}