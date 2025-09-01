/**
 * Client-side Firestore collection references
 * Only for use in client-side components
 */

import { db } from './client';
import { collection, CollectionReference } from 'firebase/firestore';
import { Order, User, RewardTransaction, Coupon, Offer } from '@/types/firestore';
import { COLLECTIONS } from './collections';

// Client-side collection references (for public reads)
export const clientCollections = {
  orders: collection(db, COLLECTIONS.ORDERS) as CollectionReference<Order>,
  users: collection(db, COLLECTIONS.USERS) as CollectionReference<User>,
  rewardTransactions: collection(db, COLLECTIONS.REWARD_TRANSACTIONS) as CollectionReference<RewardTransaction>,
  coupons: collection(db, COLLECTIONS.COUPONS) as CollectionReference<Coupon>,
  offers: collection(db, COLLECTIONS.OFFERS) as CollectionReference<Offer>
};