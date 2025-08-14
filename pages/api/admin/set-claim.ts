import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../../src/lib/firebaseAdmin';

type RequestBody = {
  email: string;
  admin: boolean;
};

type ResponseData = {
  success?: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authorization header
    const authHeader = req.headers.authorization;
    const expectedAuth = `Bearer ${process.env.ADMIN_SETUP_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { email, admin }: RequestBody = req.body;
    
    if (!email || typeof admin !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request body. Expected: { email: string, admin: boolean }' });
    }

    // Check if email is in allowlist
    const allowlistEnv = process.env.ADMIN_EMAIL_ALLOWLIST;
    if (!allowlistEnv) {
      return res.status(500).json({ error: 'Admin email allowlist not configured' });
    }

    const allowedEmails = allowlistEnv.split(',').map(email => email.trim());
    if (!allowedEmails.includes(email)) {
      return res.status(403).json({ error: 'Email not in allowlist' });
    }

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);
    
    // Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin });

    return res.status(200).json({ 
      success: true, 
      message: `Admin claim ${admin ? 'set' : 'removed'} for ${email}` 
    });

  } catch (error) {
    console.error('Error setting admin claim:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('user-not-found')) {
        return res.status(404).json({ error: 'User not found' });
      }
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}