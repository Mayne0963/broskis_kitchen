// Broski's Rewards System TypeScript Types
// Based on the technical architecture document data model

export interface LoyaltyProfile {
  userId: string;           // Firebase Auth UID
  currentPoints: number;    // Available points balance
  totalEarned: number;      // Lifetime points earned
  totalRedeemed: number;    // Lifetime points redeemed
  lastSpinAt: Date | null;  // Last spin wheel usage
  lifetimeSpins: number;    // Total spins performed
  tier: UserTier;           // User tier status
  createdAt: Date;
  updatedAt: Date;
}

export type UserTier = 'regular' | 'senior' | 'volunteer';

export interface PointsTransaction {
  id: string;               // Auto-generated document ID
  userId: string;           // Reference to user
  orderId: string;          // Associated order ID
  type: TransactionType;    // Transaction type
  amount: number;           // Points amount (positive for earned/bonus, negative for redeemed)
  orderSubtotal?: number;   // Original order subtotal (for earned points)
  earnedAt: Date;           // When points were earned
  expiresAt: Date;          // 30 days from earnedAt
  isExpired: boolean;       // Expiry status flag
  metadata?: Record<string, any>; // Additional context (spin result, reward details)
}

export type TransactionType = 'earned' | 'redeemed' | 'expired' | 'bonus';

export interface UserRedemption {
  id: string;               // Auto-generated document ID
  userId: string;           // Reference to user
  rewardId: string;         // Reference to reward catalog
  orderId: string;          // Associated order ID
  pointsCost: number;       // Points deducted
  cogsValue: number;        // Actual COGS of redeemed item
  discountAmount: number;   // Dollar value of discount applied
  idempotencyKey: string;   // Unique key for duplicate prevention
  redeemedAt: Date;
  metadata?: Record<string, any>; // Reward details snapshot
}

export interface SpinHistory {
  id: string;               // Auto-generated document ID
  userId: string;           // Reference to user
  resultType: string;       // 'points'
  pointsAwarded: number;    // Points received from spin
  isJackpot: boolean;       // Whether this was a jackpot win
  pointsCost: number;       // Points cost (5 for seniors, 0 for regular)
  idempotencyKey: string;   // Unique key for duplicate prevention
  spunAt: Date;
  wheelConfig?: Record<string, any>; // Snapshot of wheel configuration
}

export interface RewardCatalog {
  id: string;               // Reward identifier (e.g., 'free-side-100')
  name: string;             // Display name
  description: string;      // Reward description
  type: RewardType;         // Reward type
  pointsCost: number;       // Required points
  maxCogsValue: number;     // Maximum COGS allowed
  discountPercent?: number; // For percentage discounts
  category: RewardCategory; // Reward category
  isActive: boolean;        // Availability status
  sortOrder: number;        // Display ordering
  createdAt: Date;
  updatedAt: Date;
}

export type RewardType = 'fixed_item' | 'percentage_discount' | 'merchandise';
export type RewardCategory = 'food' | 'merchandise';

// API Request/Response Types

export interface BalanceResponse {
  currentPoints: number;
  pendingPoints: number;
  expiringPoints: ExpiringPoint[];
  totalEarned: number;
  totalRedeemed: number;
}

export interface ExpiringPoint {
  amount: number;
  expiresAt: string; // ISO timestamp
}

export interface RedeemRequest {
  rewardId: string;
  orderId: string;
  idempotencyKey: string;
}

export interface RedeemResponse {
  success: boolean;
  pointsDeducted: number;
  rewardApplied: RewardApplied;
  newBalance: number;
}

export interface RewardApplied {
  id: string;
  name: string;
  type: RewardType;
  discountAmount: number;
  cogsValue: number;
}

export interface SpinRequest {
  idempotencyKey: string;
}

export interface SpinResponse {
  success: boolean;
  result: SpinResult;
  pointsAwarded: number;
  nextSpinAvailable: string; // ISO timestamp
}

export interface SpinResult {
  type: string;
  value: number;
  isJackpot: boolean;
}

export interface CatalogResponse {
  rewards: RewardCatalog[];
  userPoints: number;
}

export interface HistoryResponse {
  transactions: PointsTransaction[];
  totalCount: number;
  hasMore: boolean;
}

// Admin API Types

export interface AnalyticsResponse {
  givebackPercentage: number;
  jackpotHitRate: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeUsers: number;
  averagePointsPerUser: number;
  topRewards: RewardAnalytics[];
}

export interface RewardAnalytics {
  rewardId: string;
  name: string;
  redemptionCount: number;
  totalCogs: number;
  averageCogs: number;
}

export interface UserTierUpdateRequest {
  userId: string;
  tier: UserTier;
}

export interface UserTierUpdateResponse {
  success: boolean;
  userId: string;
  newTier: UserTier;
}

// Webhook Types

export interface StripeWebhookRequest {
  orderId: string;
  userId: string;
  subtotal: number;
  status: string;
}

export interface StripeWebhookResponse {
  success: boolean;
  pointsAwarded: number;
  newBalance: number;
}

// Utility Types

export interface PaginationParams {
  limit?: number;
  offset?: number;
  startAfter?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, any>;
}

// Constants

export const POINTS_PER_DOLLAR = 0.1; // 1 point = $0.10 spend
export const POINTS_EXPIRY_DAYS = 30;
export const SPIN_COOLDOWN_HOURS = 24;
export const SENIOR_SPIN_COST = 5;
export const JACKPOT_MAX_PROBABILITY = 0.02; // 2%
export const TARGET_GIVEBACK_PERCENTAGE = 0.08; // 8%
export const VOLUNTEER_DISCOUNT_THRESHOLD = 50; // $50 minimum order
export const VOLUNTEER_DISCOUNT_PERCENTAGE = 0.1; // 10%

// Spin Wheel Configuration
export interface SpinWheelConfig {
  segments: SpinSegment[];
  jackpotProbability: number;
}

export interface SpinSegment {
  points: number;
  probability: number;
  isJackpot: boolean;
}

export const DEFAULT_SPIN_WHEEL_CONFIG: SpinWheelConfig = {
  segments: [
    { points: 5, probability: 0.4, isJackpot: false },
    { points: 10, probability: 0.3, isJackpot: false },
    { points: 20, probability: 0.2, isJackpot: false },
    { points: 25, probability: 0.08, isJackpot: false },
    { points: 50, probability: 0.02, isJackpot: true }
  ],
  jackpotProbability: 0.02
};