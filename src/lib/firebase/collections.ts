/**
 * Firestore collections utility
 * Provides collection names for both client and server use
 */

// Collection names (safe for both client and server)
export const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  REWARD_TRANSACTIONS: 'rewardTransactions',
  COUPONS: 'coupons',
  OFFERS: 'offers',
  MENU_DROPS: 'menuDrops'
} as const;