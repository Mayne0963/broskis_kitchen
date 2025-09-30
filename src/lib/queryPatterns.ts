import { db } from "@/lib/firebase/admin";
import { safeQuery, safeQueryData, safeQueryDocs, isBuildingIndex } from "@/lib/firestoreSafe";
import type { admin } from "firebase-admin";

// Type definitions for common query results
export interface QueryResult<T> {
  docs: T[];
  buildingIndex?: boolean;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'staff';
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

export interface CateringRequest {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  packageId: string;
  createdAt: admin.firestore.Timestamp;
  eventDate: admin.firestore.Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: any[];
  total: number;
  createdAt: admin.firestore.Timestamp;
}

export interface Reward {
  id: string;
  userId: string;
  type: string;
  points: number;
  description: string;
  createdAt: admin.firestore.Timestamp;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  pointsUsed: number;
  createdAt: admin.firestore.Timestamp;
}

export interface Spin {
  id: string;
  userId: string;
  dateKey: string; // Format: YYYY-MM-DD
  result: string;
  createdAt: admin.firestore.Timestamp;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  expiresAt: admin.firestore.Timestamp;
  active: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  active: boolean;
  startsAt: admin.firestore.Timestamp;
  endsAt: admin.firestore.Timestamp;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description?: string;
  updatedAt: admin.firestore.Timestamp;
}

export interface Event {
  id: string;
  title: string;
  locationId: string;
  startsAt: admin.firestore.Timestamp;
  endsAt: admin.firestore.Timestamp;
  description?: string;
}

/**
 * Query patterns for Users collection
 */
export class UserQueries {
  /**
   * Get admin users ordered by creation date (newest first)
   */
  static async getAdminUsers(limit: number = 50): Promise<User[]> {
    return safeQueryData<User>(async () =>
      db.collection("users")
        .where("role", "==", "admin")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()
    );
  }

  /**
   * Get regular users ordered by email (alphabetical)
   */
  static async getRegularUsers(limit: number = 100): Promise<User[]> {
    return safeQueryData<User>(async () =>
      db.collection("users")
        .where("role", "==", "user")
        .orderBy("email", "asc")
        .limit(limit)
        .get()
    );
  }

  /**
   * Get users by role with custom ordering
   */
  static async getUsersByRole(
    role: 'admin' | 'user' | 'staff',
    orderBy: 'createdAt' | 'email' = 'createdAt',
    direction: 'asc' | 'desc' = 'desc',
    limit?: number
  ): Promise<User[]> {
    return safeQueryData<User>(async () => {
      let query = db.collection("users")
        .where("role", "==", role)
        .orderBy(orderBy, direction);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return query.get();
    });
  }
}

/**
 * Query patterns for Catering Requests collection
 */
export class CateringQueries {
  /**
   * Get pending catering requests ordered by creation date
   */
  static async getPendingRequests(): Promise<CateringRequest[]> {
    return safeQueryData<CateringRequest>(async () =>
      db.collection("cateringRequests")
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .get()
    );
  }

  /**
   * Get catering requests by customer email
   */
  static async getRequestsByEmail(emailLower: string): Promise<CateringRequest[]> {
    return safeQueryData<CateringRequest>(async () =>
      db.collection("cateringRequests")
        .where("customer.email", "==", emailLower)
        .orderBy("createdAt", "desc")
        .get()
    );
  }

  /**
   * Get catering requests by package ID
   */
  static async getRequestsByPackage(packageId: string): Promise<CateringRequest[]> {
    return safeQueryData<CateringRequest>(async () =>
      db.collection("cateringRequests")
        .where("packageId", "==", packageId)
        .orderBy("createdAt", "desc")
        .get()
    );
  }

  /**
   * Get catering requests by status
   */
  static async getRequestsByStatus(
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ): Promise<CateringRequest[]> {
    return safeQueryData<CateringRequest>(async () =>
      db.collection("cateringRequests")
        .where("status", "==", status)
        .orderBy("createdAt", "desc")
        .get()
    );
  }
}

/**
 * Query patterns for Orders collection
 */
export class OrderQueries {
  /**
   * Get orders by user ID
   */
  static async getOrdersByUser(userId: string): Promise<Order[]> {
    return safeQueryData<Order>(async () =>
      db.collection("orders")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get()
    );
  }

  /**
   * Get paid orders
   */
  static async getPaidOrders(): Promise<Order[]> {
    return safeQueryData<Order>(async () =>
      db.collection("orders")
        .where("status", "==", "paid")
        .orderBy("createdAt", "desc")
        .get()
    );
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(
    status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  ): Promise<Order[]> {
    return safeQueryData<Order>(async () =>
      db.collection("orders")
        .where("status", "==", status)
        .orderBy("createdAt", "desc")
        .get()
    );
  }
}

/**
 * Query patterns for Rewards collection
 */
export class RewardQueries {
  /**
   * Get rewards by user ID
   */
  static async getRewardsByUser(userId: string): Promise<Reward[]> {
    return safeQueryData<Reward>(async () =>
      db.collection("rewards")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get()
    );
  }

  /**
   * Get reward redemptions by user ID
   */
  static async getRedemptionsByUser(userId: string): Promise<RewardRedemption[]> {
    return safeQueryData<RewardRedemption>(async () =>
      db.collection("rewardRedemptions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get()
    );
  }
}

/**
 * Query patterns for Spins collection
 */
export class SpinQueries {
  /**
   * Get spins by user ID ordered by date key
   */
  static async getSpinsByUser(userId: string): Promise<Spin[]> {
    return safeQueryData<Spin>(async () =>
      db.collection("spins")
        .where("userId", "==", userId)
        .orderBy("dateKey", "asc")
        .get()
    );
  }

  /**
   * Get spins by user ID ordered by creation date
   */
  static async getSpinsByUserByDate(userId: string): Promise<Spin[]> {
    return safeQueryData<Spin>(async () =>
      db.collection("spins")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get()
    );
  }
}

/**
 * Query patterns for Coupons collection
 */
export class CouponQueries {
  /**
   * Get coupon by code
   */
  static async getCouponByCode(code: string): Promise<Coupon[]> {
    return safeQueryData<Coupon>(async () =>
      db.collection("coupons")
        .where("code", "==", code)
        .orderBy("expiresAt", "desc")
        .get()
    );
  }

  /**
   * Get active coupons
   */
  static async getActiveCoupons(): Promise<Coupon[]> {
    return safeQueryData<Coupon>(async () =>
      db.collection("coupons")
        .where("active", "==", true)
        .orderBy("expiresAt", "desc")
        .get()
    );
  }
}

/**
 * Query patterns for Offers collection
 */
export class OfferQueries {
  /**
   * Get active offers
   */
  static async getActiveOffers(): Promise<Offer[]> {
    return safeQueryData<Offer>(async () =>
      db.collection("offers")
        .where("active", "==", true)
        .orderBy("startsAt", "desc")
        .get()
    );
  }

  /**
   * Get all offers ordered by start date
   */
  static async getAllOffers(): Promise<Offer[]> {
    return safeQueryData<Offer>(async () =>
      db.collection("offers")
        .orderBy("startsAt", "desc")
        .get()
    );
  }
}

/**
 * Query patterns for Menu Items collection
 */
export class MenuQueries {
  /**
   * Get menu items by category
   */
  static async getItemsByCategory(category: string): Promise<MenuItem[]> {
    return safeQueryData<MenuItem>(async () =>
      db.collection("menuItems")
        .where("category", "==", category)
        .orderBy("name", "asc")
        .get()
    );
  }

  /**
   * Get available menu items
   */
  static async getAvailableItems(): Promise<MenuItem[]> {
    return safeQueryData<MenuItem>(async () =>
      db.collection("menuItems")
        .where("available", "==", true)
        .orderBy("updatedAt", "desc")
        .get()
    );
  }

  /**
   * Get all menu items ordered by category and name
   */
  static async getAllItems(): Promise<MenuItem[]> {
    return safeQueryData<MenuItem>(async () =>
      db.collection("menuItems")
        .orderBy("category", "asc")
        .orderBy("name", "asc")
        .get()
    );
  }
}

/**
 * Query patterns for Events collection
 */
export class EventQueries {
  /**
   * Get events by location ID
   */
  static async getEventsByLocation(locationId: string): Promise<Event[]> {
    return safeQueryData<Event>(async () =>
      db.collection("events")
        .where("locationId", "==", locationId)
        .orderBy("startsAt", "asc")
        .get()
    );
  }

  /**
   * Get upcoming events (all locations)
   */
  static async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return safeQueryData<Event>(async () =>
      db.collection("events")
        .where("startsAt", ">=", now)
        .orderBy("startsAt", "asc")
        .get()
    );
  }
}

/**
 * Utility functions for common query patterns
 */
export class QueryUtils {
  /**
   * Generic function to safely execute any Firestore query
   */
  static async executeQuery<T>(
    queryFn: () => Promise<admin.firestore.QuerySnapshot>
  ): Promise<T[]> {
    return safeQueryData<T>(queryFn);
  }

  /**
   * Check if a query result indicates building indexes
   */
  static isBuildingIndex = isBuildingIndex;

  /**
   * Execute multiple queries safely and return combined results
   */
  static async executeMultipleQueries<T>(
    queries: (() => Promise<admin.firestore.QuerySnapshot>)[]
  ): Promise<T[][]> {
    const results = await Promise.all(
      queries.map(query => safeQueryData<T>(query))
    );
    return results;
  }
}

// Export all query classes for easy access
export const Queries = {
  Users: UserQueries,
  Catering: CateringQueries,
  Orders: OrderQueries,
  Rewards: RewardQueries,
  Spins: SpinQueries,
  Coupons: CouponQueries,
  Offers: OfferQueries,
  Menu: MenuQueries,
  Events: EventQueries,
  Utils: QueryUtils,
};

// Default export for convenience
export default Queries;