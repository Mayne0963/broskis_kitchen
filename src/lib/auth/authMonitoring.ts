import { adminDb } from "@/lib/firebase/admin";
import { logAuthDiscrepancy } from "./firebaseAuth";

export interface AuthDiscrepancyEvent {
  timestamp: string;
  context: string;
  userId: string;
  email: string;
  firebaseAdmin: boolean;
  nextAuthRole: string;
  discrepancyType: "role_mismatch" | "missing_firebase_claims" | "missing_nextauth_role";
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Log authentication discrepancy to Firestore for monitoring and alerting
 */
export async function logAuthDiscrepancyToFirestore(event: AuthDiscrepancyEvent): Promise<void> {
  try {
    await adminDb.collection('authDiscrepancies').add({
      ...event,
      resolved: false,
      createdAt: new Date(),
    });
    console.warn('Auth discrepancy logged to Firestore:', event);
  } catch (error) {
    console.error('Failed to log auth discrepancy to Firestore:', error);
  }
}

/**
 * Monitor authentication health and report statistics
 */
export async function getAuthHealthStats(): Promise<{
  totalDiscrepancies: number;
  recentDiscrepancies: number;
  resolutionRate: number;
  mostCommonType: string;
}> {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get total discrepancies
    const totalSnapshot = await adminDb.collection('authDiscrepancies').get();
    const totalDiscrepancies = totalSnapshot.size;
    
    // Get recent discrepancies (last 24 hours)
    const recentSnapshot = await adminDb
      .collection('authDiscrepancies')
      .where('timestamp', '>=', twentyFourHoursAgo.toISOString())
      .get();
    const recentDiscrepancies = recentSnapshot.size;
    
    // Calculate resolution rate
    const resolvedSnapshot = await adminDb
      .collection('authDiscrepancies')
      .where('resolved', '==', true)
      .get();
    const resolutionRate = totalDiscrepancies > 0 ? (resolvedSnapshot.size / totalDiscrepancies) * 100 : 100;
    
    // Find most common discrepancy type
    const typeCounts: Record<string, number> = {};
    totalSnapshot.docs.forEach(doc => {
      const type = doc.data().discrepancyType as string;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const mostCommonType = Object.keys(typeCounts).reduce(
      (a, b) => typeCounts[a] > typeCounts[b] ? a : b,
      'none'
    );
    
    return {
      totalDiscrepancies,
      recentDiscrepancies,
      resolutionRate,
      mostCommonType,
    };
  } catch (error) {
    console.error('Failed to get auth health stats:', error);
    return {
      totalDiscrepancies: 0,
      recentDiscrepancies: 0,
      resolutionRate: 100,
      mostCommonType: 'none',
    };
  }
}

/**
 * Enhanced discrepancy logging with monitoring
 */
export function logAuthDiscrepancyWithMonitoring(
  context: string,
  userId: string,
  email: string,
  firebaseAdmin: boolean | undefined,
  nextAuthRole: string | undefined,
  discrepancyType: AuthDiscrepancyEvent['discrepancyType']
): void {
  // Log to console
  logAuthDiscrepancy(context, { admin: firebaseAdmin }, nextAuthRole);
  
  // Log to Firestore for monitoring
  const event: AuthDiscrepancyEvent = {
    timestamp: new Date().toISOString(),
    context,
    userId,
    email,
    firebaseAdmin: firebaseAdmin || false,
    nextAuthRole: nextAuthRole || 'unknown',
    discrepancyType,
  };
  
  // Don't await this - fire and forget to avoid blocking
  logAuthDiscrepancyToFirestore(event).catch(error => {
    console.error('Failed to log discrepancy to Firestore:', error);
  });
}

/**
 * Check if user should have admin access based on both systems
 */
export function shouldHaveAdminAccess(
  firebaseClaims?: { admin?: boolean },
  nextAuthRole?: string,
  email?: string
): boolean {
  // If Firebase claims indicate admin, user should have access
  if (firebaseClaims?.admin) {
    return true;
  }
  
  // If NextAuth indicates admin, user should have access
  if (nextAuthRole === 'admin') {
    return true;
  }
  
  // If email is in allowlist, user should have access
  if (email) {
    const allowlistedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);
    
    if (allowlistedEmails.includes(email.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}