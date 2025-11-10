import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase';

export async function elevateUserToAdmin(targetUid: string): Promise<{ success: boolean; message?: string }>{
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }
  try {
    const fn = httpsCallable(functions, 'elevateUserToAdmin');
    const res = await fn({ targetUid });
    // Refresh ID token to pick up new claims when caller elevates self
    await auth.currentUser.getIdToken(true);
    return { success: true, message: (res?.data as any)?.message || 'Elevation succeeded' };
  } catch (err: any) {
    // Map Firebase HttpsError codes to friendly messages
    const code = err?.code;
    if (code === 'functions/permission-denied') {
      throw new Error('Permission denied: admin privileges required');
    }
    if (code === 'functions/invalid-argument') {
      throw new Error('Invalid input: check the target UID');
    }
    if (code === 'functions/unauthenticated') {
      throw new Error('Unauthenticated: please sign in');
    }
    if (code === 'functions/resource-exhausted') {
      throw new Error('Too many requests: please slow down');
    }
    throw new Error(err?.message || 'Network or server error');
  }
}