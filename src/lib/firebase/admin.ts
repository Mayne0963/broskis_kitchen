import 'server-only';
import { getApps, getFirestore } from 'firebase-admin/firestore';
import { ensureAdmin } from '../firebaseAdmin';

// Initialize the admin app
ensureAdmin();

// Get the initialized app
const app = getApps()[0]!;

export const db = getFirestore(app);