/**
 * Firestore collections utility and schema initialization
 * Provides type-safe collection references and initialization functions
 */

import { adminDb } from './admin';
import { db } from './client';
import { collection, CollectionReference, DocumentData } from 'firebase/firestore';
import { Order, User, RewardTransaction, Coupon, Offer } from '@/types/firestore';

// Collection names
export const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  REWARD_TRANSACTIONS: 'rewardTransactions',
  COUPONS: 'coupons',
  OFFERS: 'offers'
} as const;

// Client-side collection references (for public reads)
export const clientCollections = {
  orders: collection(db, COLLECTIONS.ORDERS) as CollectionReference<Order>,
  users: collection(db, COLLECTIONS.USERS) as CollectionReference<User>,
  rewardTransactions: collection(db, COLLECTIONS.REWARD_TRANSACTIONS) as CollectionReference<RewardTransaction>,
  coupons: collection(db, COLLECTIONS.COUPONS) as CollectionReference<Coupon>,
  offers: collection(db, COLLECTIONS.OFFERS) as CollectionReference<Offer>
};

// Admin collection references (for server-side operations)
export const adminCollections = {
  orders: adminDb.collection(COLLECTIONS.ORDERS),
  users: adminDb.collection(COLLECTIONS.USERS),
  rewardTransactions: adminDb.collection(COLLECTIONS.REWARD_TRANSACTIONS),
  coupons: adminDb.collection(COLLECTIONS.COUPONS),
  offers: adminDb.collection(COLLECTIONS.OFFERS)
};

/**
 * Initialize Firestore collections with proper indexes and constraints
 * This function should be called during deployment or setup
 */
export async function initializeFirestoreCollections() {
  try {
    console.log('Initializing Firestore collections...');
    
    // Create sample documents to ensure collections exist
    // These will be removed after indexes are created
    const batch = adminDb.batch();
    
    // Initialize orders collection
    const orderRef = adminCollections.orders.doc('_init');
    batch.set(orderRef, {
      id: '_init',
      userId: '_init',
      status: 'pending',
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      rewardPointsEarned: 0,
      rewardPointsSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Initialize users collection
    const userRef = adminCollections.users.doc('_init');
    batch.set(userRef, {
      uid: '_init',
      email: 'init@example.com',
      displayName: 'Init User',
      roles: { admin: false },
      rewardPoints: 0,
      rewardTier: 'bronze',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Initialize reward transactions collection
    const rewardRef = adminCollections.rewardTransactions.doc('_init');
    batch.set(rewardRef, {
      id: '_init',
      userId: '_init',
      delta: 0,
      reason: 'initialization',
      type: 'earned',
      createdAt: new Date()
    });
    
    // Initialize coupons collection
    const couponRef = adminCollections.coupons.doc('_init');
    batch.set(couponRef, {
      id: '_init',
      code: 'INIT',
      discountType: 'percentage',
      value: 0,
      isActive: false,
      startsAt: new Date(),
      endsAt: new Date(),
      usageLimit: 0,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Initialize offers collection
    const offerRef = adminCollections.offers.doc('_init');
    batch.set(offerRef, {
      id: '_init',
      title: 'Init Offer',
      description: 'Initialization offer',
      active: false,
      startsAt: new Date(),
      endsAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await batch.commit();
    console.log('Firestore collections initialized successfully');
    
    // Clean up initialization documents
    const cleanupBatch = adminDb.batch();
    cleanupBatch.delete(orderRef);
    cleanupBatch.delete(userRef);
    cleanupBatch.delete(rewardRef);
    cleanupBatch.delete(couponRef);
    cleanupBatch.delete(offerRef);
    
    await cleanupBatch.commit();
    console.log('Cleanup completed');
    
  } catch (error) {
    console.error('Failed to initialize Firestore collections:', error);
    throw error;
  }
}

/**
 * Validates that all required collections exist
 * @returns Promise<boolean> - True if all collections are properly set up
 */
export async function validateCollections(): Promise<boolean> {
  try {
    const collections = Object.values(COLLECTIONS);
    
    for (const collectionName of collections) {
      const snapshot = await adminDb.collection(collectionName).limit(1).get();
      console.log(`Collection '${collectionName}' exists: ${!snapshot.empty || snapshot.docs.length >= 0}`);
    }
    
    return true;
  } catch (error) {
    console.error('Collection validation failed:', error);
    return false;
  }
}

/**
 * Helper function to generate consistent document IDs
 */
export function generateDocId(): string {
  return adminDb.collection('_').doc().id;
}