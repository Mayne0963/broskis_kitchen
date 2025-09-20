import "server-only";
import {
  getTotalOrders,
  getRevenueMetrics,
  getUserMetrics,
  getComprehensiveKPIs,
  getRecentOrders,
  getUserSpend,
  formatUSD,
  toCentsAny,
  type DateRange,
  type KPIData
} from "./kpiHelpers";

/**
 * Test utility functions
 */
function testUtilityFunctions() {
  console.log("Testing utility functions...");
  
  // Test formatUSD
  console.log("formatUSD(1234):", formatUSD(1234)); // Should format $12.34
  console.log("formatUSD(0):", formatUSD(0)); // Should format $0.00
  
  // Test toCentsAny
  console.log("toCentsAny(12.34):", toCentsAny(12.34)); // Should return 1234
  console.log("toCentsAny('$12.34'):", toCentsAny("$12.34")); // Should return 1234
  console.log("toCentsAny(1234):", toCentsAny(1234)); // Should return 123400 (assuming dollars)
  console.log("toCentsAny(12345):", toCentsAny(12345)); // Should return 12345 (assuming cents)
  
  console.log("Utility functions test completed.\n");
}

/**
 * Test KPI functions with sample date range
 */
export async function testKPIFunctions() {
  console.log("Testing KPI helper functions...");
  
  try {
    // Test utility functions first
    testUtilityFunctions();
    
    // Define a test date range (last 30 days)
    const dateRange: DateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    };
    
    console.log("Date range:", {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString()
    });
    
    // Test getTotalOrders
    console.log("\n--- Testing getTotalOrders ---");
    const orderMetrics = await getTotalOrders(dateRange);
    console.log("Order metrics:", orderMetrics);
    
    // Test getRevenueMetrics
    console.log("\n--- Testing getRevenueMetrics ---");
    const revenueMetrics = await getRevenueMetrics(dateRange);
    console.log("Revenue metrics:", {
      ...revenueMetrics,
      revenueByDay: revenueMetrics.revenueByDay.slice(0, 5) // Show only first 5 days
    });
    
    // Test getUserMetrics
    console.log("\n--- Testing getUserMetrics ---");
    const userMetrics = await getUserMetrics(dateRange);
    console.log("User metrics:", {
      ...userMetrics,
      topSpenders: userMetrics.topSpenders.slice(0, 3) // Show only top 3 spenders
    });
    
    // Test getRecentOrders
    console.log("\n--- Testing getRecentOrders ---");
    const recentOrders = await getRecentOrders(5, dateRange);
    console.log("Recent orders:", recentOrders);
    
    // Test getComprehensiveKPIs
    console.log("\n--- Testing getComprehensiveKPIs ---");
    const comprehensiveKPIs = await getComprehensiveKPIs(dateRange);
    console.log("Comprehensive KPIs summary:", {
      orders: comprehensiveKPIs.orders,
      revenue: {
        totalRevenueUSD: comprehensiveKPIs.revenue.totalRevenueUSD,
        averageOrderValue: comprehensiveKPIs.revenue.averageOrderValue
      },
      users: {
        totalUsers: comprehensiveKPIs.users.totalUsers,
        activeUsers: comprehensiveKPIs.users.activeUsers,
        newUsers: comprehensiveKPIs.users.newUsers
      },
      dateRange: comprehensiveKPIs.dateRange
    });
    
    console.log("\n✅ All KPI function tests completed successfully!");
    return true;
    
  } catch (error) {
    console.error("❌ Error testing KPI functions:", error);
    return false;
  }
}

/**
 * Test getUserSpend function with a sample user ID
 */
export async function testGetUserSpend(userId: string) {
  console.log(`\n--- Testing getUserSpend for user: ${userId} ---`);
  
  try {
    const userSpend = await getUserSpend(userId);
    console.log("User spend data:", userSpend);
    return userSpend;
  } catch (error) {
    console.error("Error testing getUserSpend:", error);
    return null;
  }
}

// Export for use in other test files or API routes
export { testKPIFunctions as default };