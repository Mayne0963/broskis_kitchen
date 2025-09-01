import 'server-only';
import { getApps, getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from './firebaseAdmin';

// Initialize the admin app
getAdminApp();

// Get the initialized app
const app = getApps()[0]!;

export const db = getFirestore(app);