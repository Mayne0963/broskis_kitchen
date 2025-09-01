import 'server-only';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ensureAdmin } from '../firebaseAdmin';

// Initialize the admin app
ensureAdmin();

// Get the initialized app
const app = getApps()[0]!;

export const db = getFirestore(app);