/**
 * Example usage of Query Patterns with Firestore Safety Net
 * 
 * This file demonstrates how to use the query patterns and safety wrapper
 * to handle Firestore queries gracefully when indexes are still building.
 */

import { Queries } from "./queryPatterns";
import { safeQuery, isBuildingIndex } from "./firestoreSafe";
import { db } from "@/lib/firebase/admin";

/**
 * Example: Get admin users with safety net
 */
export async function getAdminUsersExample() {
  try {
    const adminUsers = await Queries.Users.getAdminUsers(50);
    
    // Check if this is a building index response
    if (Array.isArray(adminUsers) && adminUsers.length === 1 && 'buildingIndex' in adminUsers[0]) {
      console.log("Index is still building, showing fallback UI");
      return [];
    }
    
    console.log(`Found ${adminUsers.length} admin users`);
    return adminUsers;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

/**
 * Example: Get catering requests by status with error handling
 */
export async function getCateringRequestsExample() {
  try {
    const pendingRequests = await Queries.Catering.getPendingRequests();
    
    if (Array.isArray(pendingRequests) && pendingRequests.length === 1 && 'buildingIndex' in pendingRequests[0]) {
      console.log("Catering requests index building, using fallback");
      return { requests: [], indexBuilding: true };
    }
    
    return { requests: pendingRequests, indexBuilding: false };
  } catch (error) {
    console.error("Error fetching catering requests:", error);
    return { requests: [], indexBuilding: false };
  }
}

/**
 * Example: Direct usage of safeQuery wrapper
 */
export async function directSafeQueryExample(userId: string) {
  const result = await safeQuery(async () =>
    db.collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get()
  );

  // Check if index is building
  if (isBuildingIndex(result)) {
    console.log("Orders index still building:", result.message);
    return [];
  }

  // Process normal result
  const orders = result.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return orders;
}

/**
 * Example: Multiple queries with error handling
 */
export async function getUserDashboardData(userId: string) {
  try {
    // Execute multiple queries safely
    const [orders, rewards, spins] = await Promise.all([
      Queries.Orders.getOrdersByUser(userId),
      Queries.Rewards.getRewardsByUser(userId),
      Queries.Spins.getSpinsByUser(userId)
    ]);

    // Check for building indexes
    const ordersBuilding = Array.isArray(orders) && orders.length === 1 && 'buildingIndex' in orders[0];
    const rewardsBuilding = Array.isArray(rewards) && rewards.length === 1 && 'buildingIndex' in rewards[0];
    const spinsBuilding = Array.isArray(spins) && spins.length === 1 && 'buildingIndex' in spins[0];

    return {
      orders: ordersBuilding ? [] : orders,
      rewards: rewardsBuilding ? [] : rewards,
      spins: spinsBuilding ? [] : spins,
      indexesBuilding: {
        orders: ordersBuilding,
        rewards: rewardsBuilding,
        spins: spinsBuilding
      }
    };
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    return {
      orders: [],
      rewards: [],
      spins: [],
      indexesBuilding: { orders: false, rewards: false, spins: false }
    };
  }
}

/**
 * Example: Menu items by category with fallback
 */
export async function getMenuItemsExample(category: string) {
  const items = await Queries.Menu.getItemsByCategory(category);
  
  if (Array.isArray(items) && items.length === 1 && 'buildingIndex' in items[0]) {
    console.log(`Menu items index for category "${category}" is building`);
    // Return cached data or empty array as fallback
    return [];
  }
  
  return items;
}

/**
 * Example: Event queries with location filtering
 */
export async function getLocationEventsExample(locationId: string) {
  try {
    const events = await Queries.Events.getEventsByLocation(locationId);
    
    if (Array.isArray(events) && events.length === 1 && 'buildingIndex' in events[0]) {
      console.log(`Events index for location "${locationId}" is building`);
      return { events: [], indexBuilding: true };
    }
    
    return { events, indexBuilding: false };
  } catch (error) {
    console.error("Error fetching location events:", error);
    return { events: [], indexBuilding: false };
  }
}

/**
 * Example: Coupon validation with safety net
 */
export async function validateCouponExample(code: string) {
  try {
    const coupons = await Queries.Coupons.getCouponByCode(code);
    
    if (Array.isArray(coupons) && coupons.length === 1 && 'buildingIndex' in coupons[0]) {
      console.log("Coupon index building, cannot validate at this time");
      return { valid: false, reason: "index_building" };
    }
    
    if (coupons.length === 0) {
      return { valid: false, reason: "not_found" };
    }
    
    const coupon = coupons[0];
    const now = new Date();
    const isExpired = coupon.expiresAt.toDate() < now;
    
    return {
      valid: coupon.active && !isExpired,
      reason: !coupon.active ? "inactive" : isExpired ? "expired" : "valid",
      coupon
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, reason: "error" };
  }
}

// Export all examples for easy testing
export const Examples = {
  getAdminUsers: getAdminUsersExample,
  getCateringRequests: getCateringRequestsExample,
  directSafeQuery: directSafeQueryExample,
  getUserDashboard: getUserDashboardData,
  getMenuItems: getMenuItemsExample,
  getLocationEvents: getLocationEventsExample,
  validateCoupon: validateCouponExample,
};