# Broski's Kitchen - Database Schema Documentation

This document outlines the complete data structure for the Broski's Kitchen application, including Firestore collections, document schemas, and relationships.

## Table of Contents

1. [Overview](#overview)
2. [User Management](#user-management)
3. [Product Catalog](#product-catalog)
4. [Order Management](#order-management)
5. [Event System](#event-system)
6. [Loyalty Program](#loyalty-program)
7. [Payment System](#payment-system)
8. [Content Management](#content-management)
9. [Analytics](#analytics)
10. [Relationships](#relationships)

## Overview

### Database Design Principles

- **Denormalization**: Optimized for read performance
- **Subcollections**: Used for related data that belongs to a parent
- **References**: Used for relationships between independent entities
- **Timestamps**: All documents include `createdAt` and `updatedAt`
- **Soft Deletes**: Important data is marked as deleted rather than removed

### Common Fields

All documents include these standard fields:

```typescript
interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string; // User ID who created the document
  updatedBy?: string; // User ID who last updated the document
}
```

## User Management

### Collection: `users`

```typescript
interface User extends BaseDocument {
  // Authentication
  email: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  
  // Profile
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string; // Storage URL
  dateOfBirth?: Timestamp;
  
  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      marketing: boolean;
    };
    dietary: {
      vegetarian: boolean;
      vegan: boolean;
      glutenFree: boolean;
      dairyFree: boolean;
      nutFree: boolean;
      other: string[];
    };
    language: string; // 'en', 'es', etc.
    timezone: string;
  };
  
  // Address Information
  addresses: Address[];
  defaultAddressId?: string;
  
  // Account Status
  status: 'active' | 'suspended' | 'deleted';
  roles: ('user' | 'admin' | 'staff')[];
  
  // Loyalty
  loyaltyId?: string; // Reference to loyalty document
  
  // Metadata
  lastLoginAt?: Timestamp;
  loginCount: number;
  source: 'web' | 'mobile' | 'admin'; // Registration source
}

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
}
```

### Subcollection: `users/{userId}/sessions`

```typescript
interface UserSession extends BaseDocument {
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
    isMobile: boolean;
  };
  ipAddress: string;
  location?: {
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  loginAt: Timestamp;
  logoutAt?: Timestamp;
  isActive: boolean;
}
```

## Product Catalog

### Collection: `categories`

```typescript
interface Category extends BaseDocument {
  name: string;
  slug: string; // URL-friendly name
  description?: string;
  image?: string; // Storage URL
  icon?: string; // Icon name or URL
  
  // Hierarchy
  parentId?: string; // Reference to parent category
  level: number; // 0 for root categories
  path: string[]; // Array of parent category IDs
  
  // Display
  order: number; // Sort order
  isActive: boolean;
  isFeatured: boolean;
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  
  // Statistics
  productCount: number;
  viewCount: number;
}
```

### Collection: `products`

```typescript
interface Product extends BaseDocument {
  // Basic Information
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Categorization
  categoryId: string; // Reference to category
  categoryPath: string[]; // Full category path
  tags: string[];
  
  // Pricing
  price: number; // Base price in cents
  compareAtPrice?: number; // Original price for sales
  cost?: number; // Cost price (admin only)
  
  // Variants
  hasVariants: boolean;
  variants: ProductVariant[];
  
  // Media
  images: ProductImage[];
  videos?: ProductVideo[];
  
  // Inventory
  inventory: {
    trackQuantity: boolean;
    quantity: number;
    lowStockThreshold: number;
    allowBackorder: boolean;
    sku?: string;
    barcode?: string;
  };
  
  // Attributes
  attributes: {
    weight?: number; // in grams
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    material?: string;
    color?: string;
    size?: string;
  };
  
  // Dietary Information
  dietary: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    allergens: string[];
    ingredients: string[];
    nutritionFacts?: string; // Detailed nutrition info
  };
  
  // Status
  status: 'draft' | 'active' | 'archived';
  isAvailable: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  
  // Statistics
  viewCount: number;
  orderCount: number;
  rating: {
    average: number;
    count: number;
  };
  
  // Scheduling
  availableFrom?: Timestamp;
  availableUntil?: Timestamp;
}

interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventory: {
    quantity: number;
    trackQuantity: boolean;
  };
  attributes: Record<string, string>; // size: 'Large', color: 'Red'
  image?: string;
  isDefault: boolean;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  order: number;
  isDefault: boolean;
}

interface ProductVideo {
  id: string;
  url: string;
  thumbnail: string;
  title?: string;
  duration?: number;
}
```

### Collection: `menuItems`

```typescript
interface MenuItem extends BaseDocument {
  // Basic Information
  name: string;
  description: string;
  shortDescription?: string;
  
  // Categorization
  category: 'appetizer' | 'main' | 'dessert' | 'beverage' | 'special';
  cuisine?: string; // 'italian', 'mexican', etc.
  
  // Pricing
  price: number;
  sizes?: MenuItemSize[];
  
  // Media
  image?: string;
  images: string[];
  
  // Dietary Information
  dietary: {
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    allergens: string[];
    ingredients: string[];
    spiceLevel?: 1 | 2 | 3 | 4 | 5;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
  };
  
  // Customization
  customizations: MenuCustomization[];
  
  // Availability
  isAvailable: boolean;
  availableDays: number[]; // 0-6 (Sunday-Saturday)
  availableHours: {
    start: string; // '09:00'
    end: string;   // '22:00'
  };
  
  // Display
  order: number;
  isFeatured: boolean;
  isSpecial: boolean;
  
  // Preparation
  prepTime: number; // minutes
  cookTime: number; // minutes
  
  // Statistics
  orderCount: number;
  rating: {
    average: number;
    count: number;
  };
}

interface MenuItemSize {
  id: string;
  name: string; // 'Small', 'Medium', 'Large'
  price: number;
  calories?: number;
  isDefault: boolean;
}

interface MenuCustomization {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  required: boolean;
  maxSelections?: number;
  options: CustomizationOption[];
}

interface CustomizationOption {
  id: string;
  name: string;
  price: number; // Additional cost
  isDefault: boolean;
}
```

## Order Management

### Collection: `orders`

```typescript
interface Order extends BaseDocument {
  // Order Identification
  orderNumber: string; // Human-readable order number
  
  // Customer Information
  userId?: string; // null for guest orders
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  
  // Order Items
  items: OrderItem[];
  
  // Pricing
  subtotal: number; // Sum of item prices
  tax: number;
  tip: number;
  deliveryFee: number;
  discount: number;
  total: number;
  
  // Discounts
  discounts: OrderDiscount[];
  
  // Fulfillment
  type: 'pickup' | 'delivery' | 'dine-in';
  fulfillment: {
    // Pickup/Delivery
    address?: Address;
    instructions?: string;
    
    // Timing
    requestedTime?: Timestamp;
    estimatedTime?: Timestamp;
    actualTime?: Timestamp;
    
    // Delivery
    deliveryRadius?: number;
    deliveryZone?: string;
    
    // Dine-in
    tableNumber?: string;
    partySize?: number;
  };
  
  // Status Tracking
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'completed' | 'cancelled';
  statusHistory: OrderStatusUpdate[];
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially-refunded';
  paymentMethod: 'card' | 'cash' | 'digital-wallet';
  paymentIntentId?: string; // Stripe payment intent ID
  
  // Special Instructions
  notes?: string;
  specialRequests?: string;
  
  // Loyalty
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  
  // Metadata
  source: 'web' | 'mobile' | 'phone' | 'in-person';
  channel: 'online' | 'restaurant';
  
  // Analytics
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

interface OrderItem {
  id: string;
  type: 'product' | 'menu-item';
  productId?: string;
  menuItemId?: string;
  
  // Item Details
  name: string;
  description?: string;
  image?: string;
  
  // Pricing
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  
  // Variants/Customizations
  variantId?: string;
  size?: string;
  customizations: ItemCustomization[];
  
  // Special Instructions
  notes?: string;
  
  // Dietary
  allergens: string[];
}

interface ItemCustomization {
  id: string;
  name: string;
  value: string;
  price: number;
}

interface OrderDiscount {
  id: string;
  type: 'percentage' | 'fixed' | 'free-shipping';
  code?: string; // Coupon code
  name: string;
  amount: number;
  appliedTo: 'order' | 'shipping' | 'item';
  itemIds?: string[]; // If applied to specific items
}

interface OrderStatusUpdate {
  status: string;
  timestamp: Timestamp;
  note?: string;
  updatedBy?: string; // User ID
}
```

### Subcollection: `orders/{orderId}/tracking`

```typescript
interface OrderTracking extends BaseDocument {
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedArrival?: Timestamp;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}
```

## Event System

### Collection: `events`

```typescript
interface Event extends BaseDocument {
  // Basic Information
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  
  // Scheduling
  startDate: Timestamp;
  endDate: Timestamp;
  timezone: string;
  isAllDay: boolean;
  
  // Recurrence
  isRecurring: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // Every N days/weeks/months/years
    endDate?: Timestamp;
    daysOfWeek?: number[]; // For weekly recurrence
    dayOfMonth?: number; // For monthly recurrence
  };
  
  // Location
  location: {
    type: 'physical' | 'virtual' | 'hybrid';
    venue?: string;
    address?: Address;
    virtualLink?: string;
    instructions?: string;
  };
  
  // Capacity
  capacity: {
    max: number;
    current: number;
    waitlist: number;
  };
  
  // Pricing
  pricing: {
    type: 'free' | 'paid' | 'donation';
    price?: number;
    currency: string;
    earlyBirdPrice?: number;
    earlyBirdUntil?: Timestamp;
  };
  
  // Media
  image?: string;
  images: string[];
  video?: string;
  
  // Categorization
  category: 'workshop' | 'tasting' | 'special-dinner' | 'private-event' | 'catering';
  tags: string[];
  
  // Requirements
  requirements: {
    ageRestriction?: number;
    dietaryAccommodations: boolean;
    specialRequirements?: string;
  };
  
  // Status
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPublic: boolean;
  isFeatured: boolean;
  
  // Registration
  registrationRequired: boolean;
  registrationDeadline?: Timestamp;
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
  };
  
  // Statistics
  viewCount: number;
  registrationCount: number;
  
  // Host Information
  host: {
    name: string;
    bio?: string;
    image?: string;
    contact?: string;
  };
}
```

### Collection: `bookings`

```typescript
interface Booking extends BaseDocument {
  // Event Reference
  eventId: string;
  eventTitle: string;
  eventDate: Timestamp;
  
  // Customer Information
  userId?: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  
  // Booking Details
  partySize: number;
  specialRequests?: string;
  dietaryRestrictions?: string[];
  
  // Status
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  totalAmount: number;
  
  // Confirmation
  confirmationCode: string;
  
  // Communication
  reminderSent: boolean;
  confirmationSent: boolean;
  
  // Check-in
  checkedInAt?: Timestamp;
  checkedInBy?: string;
  
  // Cancellation
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  refundAmount?: number;
}
```

## Loyalty Program

### Collection: `loyalty`

```typescript
interface LoyaltyAccount extends BaseDocument {
  // User Reference
  userId: string;
  
  // Points
  points: {
    current: number;
    lifetime: number;
    pending: number; // Points from recent orders not yet credited
  };
  
  // Tier System
  tier: {
    current: 'bronze' | 'silver' | 'gold' | 'platinum';
    progress: number; // Progress to next tier (0-100)
    nextTier?: string;
    pointsToNextTier: number;
  };
  
  // Status
  status: 'active' | 'suspended' | 'expired';
  
  // Dates
  joinedAt: Timestamp;
  lastActivityAt: Timestamp;
  tierAchievedAt: Timestamp;
  expiresAt?: Timestamp;
  
  // Statistics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  
  // Preferences
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    birthdayRewards: boolean;
  };
}
```

### Subcollection: `loyalty/{loyaltyId}/transactions`

```typescript
interface LoyaltyTransaction extends BaseDocument {
  // Transaction Details
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number; // Positive for earned, negative for redeemed
  
  // Reference
  orderId?: string;
  rewardId?: string;
  
  // Description
  description: string;
  reason?: string; // For adjustments
  
  // Status
  status: 'pending' | 'completed' | 'cancelled';
  
  // Expiration
  expiresAt?: Timestamp;
  
  // Metadata
  source: 'order' | 'bonus' | 'referral' | 'birthday' | 'manual';
  processedBy?: string; // Admin user ID for manual adjustments
}
```

### Collection: `rewards`

```typescript
interface Reward extends BaseDocument {
  // Basic Information
  name: string;
  description: string;
  image?: string;
  
  // Cost
  pointsCost: number;
  
  // Type
  type: 'discount' | 'free-item' | 'upgrade' | 'experience';
  
  // Reward Details
  value: {
    type: 'percentage' | 'fixed' | 'item';
    amount?: number; // For discounts
    itemId?: string; // For free items
    description: string;
  };
  
  // Eligibility
  eligibility: {
    tiers: string[]; // Which loyalty tiers can redeem
    minOrderValue?: number;
    maxRedemptions?: number; // Per user
    firstTimeOnly?: boolean;
  };
  
  // Availability
  isActive: boolean;
  availableFrom?: Timestamp;
  availableUntil?: Timestamp;
  
  // Usage Limits
  totalLimit?: number; // Total redemptions allowed
  dailyLimit?: number;
  userLimit?: number; // Per user limit
  
  // Statistics
  redemptionCount: number;
  
  // Terms
  terms: string[];
  restrictions: string[];
}
```

## Payment System

### Collection: `payments`

```typescript
interface Payment extends BaseDocument {
  // References
  orderId?: string;
  bookingId?: string;
  userId?: string;
  
  // Payment Details
  amount: number;
  currency: string;
  
  // Payment Method
  method: 'card' | 'cash' | 'digital-wallet' | 'bank-transfer';
  provider: 'stripe' | 'paypal' | 'square' | 'cash';
  
  // Provider Details
  providerPaymentId: string; // Stripe payment intent ID, etc.
  providerCustomerId?: string;
  
  // Status
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
  
  // Card Details (if applicable)
  card?: {
    last4: string;
    brand: string; // 'visa', 'mastercard', etc.
    expMonth: number;
    expYear: number;
    fingerprint: string;
  };
  
  // Fees
  fees: {
    processing: number;
    platform: number;
    total: number;
  };
  
  // Refunds
  refunds: PaymentRefund[];
  
  // Metadata
  description?: string;
  receiptUrl?: string;
  
  // Timestamps
  authorizedAt?: Timestamp;
  capturedAt?: Timestamp;
  failedAt?: Timestamp;
  
  // Failure Details
  failureCode?: string;
  failureMessage?: string;
  
  // Risk Assessment
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

interface PaymentRefund {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Timestamp;
  processedAt?: Timestamp;
  providerRefundId: string;
}
```

## Content Management

### Collection: `pages`

```typescript
interface Page extends BaseDocument {
  // Basic Information
  title: string;
  slug: string;
  content: string; // HTML or Markdown
  excerpt?: string;
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
    ogImage?: string;
  };
  
  // Status
  status: 'draft' | 'published' | 'archived';
  
  // Scheduling
  publishedAt?: Timestamp;
  scheduledFor?: Timestamp;
  
  // Template
  template: 'default' | 'landing' | 'contact' | 'about';
  
  // Navigation
  showInMenu: boolean;
  menuOrder?: number;
  parentPageId?: string;
  
  // Statistics
  viewCount: number;
  
  // Author
  authorId: string;
}
```

### Collection: `blog`

```typescript
interface BlogPost extends BaseDocument {
  // Basic Information
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  
  // Media
  featuredImage?: string;
  images: string[];
  
  // Categorization
  categories: string[];
  tags: string[];
  
  // SEO
  seo: {
    title?: string;
    description?: string;
    keywords: string[];
    ogImage?: string;
  };
  
  // Status
  status: 'draft' | 'published' | 'archived';
  
  // Scheduling
  publishedAt?: Timestamp;
  scheduledFor?: Timestamp;
  
  // Author
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  
  // Engagement
  viewCount: number;
  likeCount: number;
  commentCount: number;
  
  // Reading
  readingTime: number; // Estimated reading time in minutes
  
  // Related
  relatedPosts: string[]; // Array of post IDs
}
```

## Analytics

### Collection: `analytics`

```typescript
interface AnalyticsEvent extends BaseDocument {
  // Event Details
  event: string; // 'page_view', 'product_view', 'add_to_cart', etc.
  category: string; // 'engagement', 'ecommerce', 'navigation'
  
  // User Information
  userId?: string;
  sessionId: string;
  
  // Page/Product Context
  page?: {
    url: string;
    title: string;
    referrer?: string;
  };
  
  // Product Context
  product?: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
  
  // Custom Properties
  properties: Record<string, any>;
  
  // Device/Browser
  device: {
    userAgent: string;
    platform: string;
    browser: string;
    isMobile: boolean;
    screenResolution?: string;
  };
  
  // Location
  location?: {
    country: string;
    region: string;
    city: string;
    timezone: string;
  };
  
  // UTM Parameters
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  
  // Value
  value?: number; // For revenue events
  currency?: string;
}
```

## Relationships

### Entity Relationship Diagram

```
Users (1) ←→ (M) Orders
Users (1) ←→ (1) Loyalty
Users (1) ←→ (M) Bookings
Users (1) ←→ (M) Payments

Categories (1) ←→ (M) Products
Categories (1) ←→ (M) Categories (self-reference)

Products (M) ←→ (M) Orders (through OrderItems)
MenuItems (M) ←→ (M) Orders (through OrderItems)

Events (1) ←→ (M) Bookings

Orders (1) ←→ (M) Payments
Bookings (1) ←→ (M) Payments

Loyalty (1) ←→ (M) LoyaltyTransactions
Rewards (M) ←→ (M) LoyaltyTransactions

Users (1) ←→ (M) BlogPosts (as author)
Users (1) ←→ (M) Pages (as author)
```

### Data Access Patterns

1. **User Dashboard**
   - Get user profile
   - Get recent orders
   - Get loyalty status
   - Get upcoming bookings

2. **Product Catalog**
   - Get categories with product counts
   - Get products by category
   - Get featured products
   - Search products

3. **Order Management**
   - Get orders by user
   - Get orders by status
   - Get order details with items
   - Track order status

4. **Admin Dashboard**
   - Get order statistics
   - Get product performance
   - Get user analytics
   - Manage inventory

### Indexing Strategy

Key composite indexes for optimal query performance:

1. `orders`: `userId + createdAt`
2. `orders`: `status + createdAt`
3. `products`: `categoryId + featured + createdAt`
4. `bookings`: `eventId + date`
5. `loyaltyTransactions`: `loyaltyId + createdAt`
6. `analytics`: `event + createdAt`

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: Broski's Kitchen Development Team