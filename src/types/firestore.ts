/**
 * TypeScript interfaces for Firestore collection schemas
 * Ensures type safety for database operations
 */

import { Timestamp } from 'firebase/firestore';

// Order related types
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  couponId?: string;
  rewardPointsEarned: number;
  rewardPointsSpent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    instructions?: string;
  };
  paymentMethod?: {
    type: 'card' | 'cash' | 'digital';
    last4?: string;
  };
}

// User related types
export interface UserRoles {
  admin: boolean;
  kitchen?: boolean;
  delivery?: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  roles: UserRoles;
  rewardPoints: number;
  rewardTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: {
    notifications: boolean;
    marketing: boolean;
  };
}

// Reward transaction types
export interface RewardTransaction {
  id: string;
  userId: string;
  delta: number; // Positive for earned, negative for spent
  reason: string;
  orderId?: string;
  createdAt: Timestamp;
  type: 'earned' | 'spent' | 'expired' | 'bonus';
  description?: string;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  startsAt: Timestamp;
  endsAt: Timestamp;
  usageLimit: number;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description?: string;
  minimumOrderValue?: number;
  applicableItems?: string[]; // Item IDs this coupon applies to
}

// Offer types
export interface Offer {
  id: string;
  title: string;
  description: string;
  active: boolean;
  startsAt: Timestamp;
  endsAt: Timestamp;
  rewardBonus?: number; // Extra reward points for this offer
  createdAt: Timestamp;
  updatedAt: Timestamp;
  imageUrl?: string;
  terms?: string;
  targetAudience?: 'all' | 'new' | 'loyal' | 'vip';
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface OrdersResponse extends PaginatedResponse<Order> {}
export interface UsersResponse extends PaginatedResponse<User> {}
export interface RewardTransactionsResponse extends PaginatedResponse<RewardTransaction> {}
export interface CouponsResponse extends PaginatedResponse<Coupon> {}
export interface OffersResponse extends PaginatedResponse<Offer> {}

// Admin API query parameters
export interface OrdersQuery {
  status?: Order['status'];
  from?: string; // ISO date string
  to?: string; // ISO date string
  cursor?: string;
  limit?: number;
  sort?: 'createdAt' | 'updatedAt' | 'total';
  dir?: 'asc' | 'desc';
}

export interface UsersQuery {
  query?: string; // Search by email or displayName
  cursor?: string;
  limit?: number;
  role?: keyof UserRoles;
}

export interface RewardSummary {
  userId: string;
  rewardPoints: number;
  rewardTier: User['rewardTier'];
  recentTransactions: RewardTransaction[];
  totalEarned: number;
  totalSpent: number;
}

export interface CouponsQuery {
  active?: boolean;
  code?: string;
  cursor?: string;
  limit?: number;
}

export interface OffersQuery {
  activeOnly?: boolean;
  cursor?: string;
  limit?: number;
}

// Error response type
export interface ApiError {
  error: string;
  details