/**
 * Shared helper to detect test orders using multiple detection methods
 * Provides robust identification of orders containing test products
 */

export interface OrderLike {
  items?: Array<{
    productId?: string;
    id?: string;
  }>;
  tags?: string[];
  isTest?: boolean;
  metadata?: {
    isTest?: boolean;
  };
  totalCents?: number;
  total?: number;
  amount_total?: number;
  currency?: string;
}

/**
 * Determines if an order should be marked as a test order
 * Uses multiple detection methods for robust identification
 */
export function isTestOrder(order: OrderLike): boolean {
  if (!order) return false;

  // Method 1: Check if any item has the test product ID
  const byItem = order.items?.some(item => 
    item?.productId === "test-item-5c" || item?.id === "test-item-5c"
  ) || false;

  // Method 2: Check if tags array includes "test"
  const byTag = Array.isArray(order.tags) && order.tags.includes("test");

  // Method 3: Check explicit isTest flag
  const byFlag = !!order.isTest;

  // Method 4: Check metadata.isTest
  const byMeta = !!order.metadata?.isTest;

  // Method 5: Very safe fallback - totalCents <= 5 AND currency === 'USD'
  // Handle different total field names (totalCents, total, amount_total)
  const totalAmount = order.totalCents || order.total || order.amount_total || 0;
  const byAmount = Number(totalAmount) <= 5 && order.currency === 'USD';

  return Boolean(byItem || byTag || byFlag || byMeta || byAmount);
}

/**
 * Creates test order tags array
 * Ensures "test" tag is included when order is identified as test
 */
export function createTestOrderTags(existingTags: string[] = []): string[] {
  const tags = [...existingTags];
  if (!tags.includes("test")) {
    tags.push("test");
  }
  return tags;
}

/**
 * Applies test order marking to an order object
 * Sets isTest flag and ensures test tag is present
 */
export function markAsTestOrder<T extends OrderLike>(order: T): T {
  return {
    ...order,
    isTest: true,
    tags: createTestOrderTags(order.tags),
    metadata: {
      ...order.metadata,
      isTest: true
    }
  };
}