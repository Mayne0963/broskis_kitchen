import { auth, db, isFirebaseReady } from '@/lib/firebaseClient';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const subscribeToAuth = (callback: (user: User | null, role: string | null) => void) => {
  // Skip auth subscription during build time or when Firebase is not ready
  if (!isFirebaseReady()) {
    // Return a no-op unsubscribe function for build time
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const role = userData?.role || null;
        callback(user, role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        callback(user, null);
      }
    } else {
      callback(null, null);
    }
  });
};