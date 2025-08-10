# Broski's Kitchen - Enhanced Functionality Upgrade Plan

## 1. Feature Specification

### AI-Powered Menu Drops
- **Location**: New `/menu-drops` page with existing styling framework
- **Integration**: Connects to existing menu system, adds scheduling and inventory triggers
- **Components**: Drop announcement cards, notification signup forms, countdown timers
- **Features**: Auto-publish based on inventory alerts, "Notify Me" waitlists, limited-time availability

### Enhanced Age Gate & Compliance
- **Location**: Existing age gate component enhancement
- **Integration**: Adds GDPR consent tracking, cookie management without visual changes
- **Components**: Consent modal overlay, privacy preferences panel, cookie banner
- **Features**: GDPR compliance tracking, granular cookie controls, audit logging

### Advanced Checkout Flow
- **Location**: Existing `/checkout` page enhancement
- **Integration**: Stripe integration, saved payment methods, real-time order tracking
- **Components**: Payment method selector, order status tracker, delivery ETA display
- **Features**: Apple/Google Pay, saved cards, Cash-on-Delivery for Premium, WebSocket updates

### Rewards & Loyalty Dashboard
- **Location**: New tab in existing `/dashboard` page layout
- **Integration**: Extends current dashboard with rewards section using existing styling
- **Components**: Points display, tier progress bars, redeemable offers grid
- **Features**: Point accumulation, tier progression, exclusive offers, redemption tracking

### Admin Panel Improvements
- **Location**: Enhanced `/admin` routes with existing admin styling
- **Integration**: Builds on current admin framework, adds role-based controls
- **Components**: Role management interface, live order feed, A/B testing controls
- **Features**: Role-based access, live order stream, menu item testing, analytics dashboard

### OTW Integration
- **Location**: Cart and checkout flow enhancement
- **Integration**: Delivery routing logic, ETA calculations, rider tracking
- **Components**: Delivery option selector, rider tracking map, ETA display
- **Features**: Auto-routing through OTW, real-time ETAs, rider SSO authentication

## 2. Updated File Structure

```
src/
├── app/
│   ├── menu-drops/
│   │   ├── page.tsx                    # AI-powered menu drops page
│   │   ├── [dropId]/
│   │   │   └── page.tsx                # Individual drop details
│   │   └── loading.tsx                 # Loading state
│   ├── admin/
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Enhanced admin dashboard
│   │   │   ├── orders/page.tsx         # Live order stream
│   │   │   ├── menu-testing/page.tsx   # A/B testing controls
│   │   │   └── roles/page.tsx          # Role management
│   │   ├── layout.tsx                  # Admin layout with role checks
│   │   └── middleware.ts               # Admin route protection
│   ├── api/
│   │   ├── menu-drops/
│   │   │   ├── route.ts                # Menu drop CRUD operations
│   │   │   ├── schedule/route.ts       # Drop scheduling logic
│   │   │   ├── notify/route.ts         # Notification signups
│   │   │   └── inventory/route.ts      # Inventory-based triggers
│   │   ├── checkout/
│   │   │   ├── session/route.ts        # Stripe checkout sessions
│   │   │   ├── payment-methods/route.ts # Saved payment methods
│   │   │   ├── status/route.ts         # Order status updates
│   │   │   └── webhook/route.ts        # Stripe webhook handler
│   │   ├── rewards/
│   │   │   ├── points/route.ts         # Points calculation
│   │   │   ├── tiers/route.ts          # Loyalty tier management
│   │   │   ├── offers/route.ts         # Redeemable offers
│   │   │   └── redeem/route.ts         # Offer redemption
│   │   ├── admin/
│   │   │   ├── orders/route.ts         # Admin order management
│   │   │   ├── roles/route.ts          # Role-based access control
│   │   │   ├── analytics/route.ts      # A/B testing data
│   │   │   └── menu-testing/route.ts   # Menu item testing
│   │   ├── otw/
│   │   │   ├── availability/route.ts   # OTW rider availability
│   │   │   ├── estimate/route.ts       # Delivery time estimates
│   │   │   ├── track/route.ts          # Order tracking
│   │   │   └── auth/route.ts           # OTW SSO authentication
│   │   ├── compliance/
│   │   │   ├── consent/route.ts        # GDPR consent tracking
│   │   │   ├── cookies/route.ts        # Cookie preferences
│   │   │   └── audit/route.ts          # Compliance audit logs
│   │   └── websocket/
│   │       └── orders/route.ts         # WebSocket order updates
├── components/
│   ├── menu-drops/
│   │   ├── DropCard.tsx                # Menu drop announcement card
│   │   ├── NotifyButton.tsx            # Notification signup button
│   │   ├── DropSchedule.tsx            # Drop schedule display
│   │   ├── CountdownTimer.tsx          # Drop countdown timer
│   │   └── InventoryAlert.tsx          # Low inventory notifications
│   ├── cart/
│   │   ├── CheckoutFlow.tsx            # Enhanced checkout process
│   │   ├── PaymentMethods.tsx          # Saved payment method selector
│   │   ├── DeliveryOptions.tsx         # OTW integration options
│   │   ├── OrderTracker.tsx            # Real-time order status
│   │   └── ETADisplay.tsx              # Delivery time estimates
│   ├── dashboard/
│   │   ├── RewardsTab.tsx              # Loyalty rewards section
│   │   ├── PointsDisplay.tsx           # Points and tier progress
│   │   ├── OffersGrid.tsx              # Redeemable offers grid
│   │   ├── TierProgress.tsx            # Loyalty tier progression
│   │   └── RedemptionHistory.tsx       # Past redemptions
│   ├── admin/
│   │   ├── LiveOrderFeed.tsx           # Real-time order stream
│   │   ├── RoleManager.tsx             # User role management
│   │   ├── ABTestControls.tsx          # Menu A/B testing
│   │   ├── AnalyticsDashboard.tsx      # Performance metrics
│   │   └── MenuTestingPanel.tsx        # Menu item testing interface
│   ├── compliance/
│   │   ├── ConsentModal.tsx            # GDPR consent modal
│   │   ├── CookiePreferences.tsx       # Cookie management
│   │   ├── PrivacySettings.tsx         # Privacy preference panel
│   │   └── ComplianceBanner.tsx        # Cookie consent banner
│   ├── otw/
│   │   ├── DeliveryTracker.tsx         # OTW delivery tracking
│   │   ├── RiderMap.tsx                # Live rider location map
│   │   ├── SSOLogin.tsx                # OTW rider SSO login
│   │   └── DeliveryEstimate.tsx        # Delivery time calculator
│   └── websocket/
│       ├── OrderStatusProvider.tsx     # WebSocket context provider
│       └── useOrderStatus.tsx          # Order status hook
├── lib/
│   ├── stripe/
│   │   ├── client.ts                   # Stripe client configuration
│   │   └── webhooks.ts                 # Webhook verification
│   ├── websocket/
│   │   ├── server.ts                   # WebSocket server setup
│   │   └── client.ts                   # WebSocket client utilities
│   ├── otw/
│   │   ├── api.ts                      # OTW API integration
│   │   └── auth.ts                     # OTW SSO utilities
│   ├── compliance/
│   │   ├── gdpr.ts                     # GDPR compliance utilities
│   │   └── cookies.ts                  # Cookie management
│   └── rewards/
│       ├── calculator.ts               # Points calculation logic
│       └── tiers.ts                    # Loyalty tier definitions
```

## 3. Component Implementation

### Menu Drops Page
```typescript
// app/menu-drops/page.tsx
import { getActiveMenuDrops, getScheduledDrops } from '@/lib/api/menu-drops'
import DropCard from '@/components/menu-drops/DropCard'
import DropSchedule from '@/components/menu-drops/DropSchedule'

export default async function MenuDropsPage() {
  const [activeDrops, scheduledDrops] = await Promise.all([
    getActiveMenuDrops(),
    getScheduledDrops()
  ])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-[var(--color-harvest-gold)]">
          Limited Menu Drops
        </h1>
        
        {/* Active Drops Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-[var(--color-harvest-gold)]">
            Available Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeDrops.map(drop => (
              <DropCard key={drop.id} drop={drop} isActive={true} />
            ))}
          </div>
        </section>
        
        {/* Scheduled Drops Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-[var(--color-harvest-gold)]">
            Coming Soon
          </h2>
          <DropSchedule drops={scheduledDrops} />
        </section>
      </div>
    </div>
  )
}
```

### Enhanced Checkout Flow
```typescript
// components/cart/CheckoutFlow.tsx
"use client"

import { useState, useEffect } from 'react'
import { useOrderStatus } from '@/components/websocket/useOrderStatus'
import PaymentMethods from './PaymentMethods'
import DeliveryOptions from './DeliveryOptions'
import OrderTracker from './OrderTracker'

interface CheckoutFlowProps {
  cartItems: CartItem[]
  userId: string
}

export default function CheckoutFlow({ cartItems, userId }: CheckoutFlowProps) {
  const [step, setStep] = useState<'payment' | 'delivery' | 'confirmation'>('payment')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [deliveryOption, setDeliveryOption] = useState<string | null>(null)
  
  const { orderStatus, isConnected } = useOrderStatus(orderId)
  
  // Preserve existing cart styling with enhanced functionality
  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[var(--color-harvest-gold)]">
            Checkout
          </h2>
          {isConnected && (
            <div className="flex items-center text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live Updates
            </div>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center ${step === 'payment' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-2">
              1
            </div>
            Payment
          </div>
          <div className="flex-1 h-px bg-gray-600"></div>
          <div className={`flex items-center ${step === 'delivery' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-2">
              2
            </div>
            Delivery
          </div>
          <div className="flex-1 h-px bg-gray-600"></div>
          <div className={`flex items-center ${step === 'confirmation' ? 'text-[var(--color-harvest-gold)]' : 'text-gray-400'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-2">
              3
            </div>
            Confirmation
          </div>
        </div>
      </div>
      
      {step === 'payment' && (
        <PaymentMethods 
          onPaymentSelected={(method) => {
            setPaymentMethod(method)
            setStep('delivery')
          }}
          userId={userId}
          cartTotal={cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}
        />
      )}
      
      {step === 'delivery' && (
        <DeliveryOptions 
          onDeliverySelected={(option) => {
            setDeliveryOption(option)
            setStep('confirmation')
          }}
          cartItems={cartItems}
          paymentMethod={paymentMethod}
        />
      )}
      
      {step === 'confirmation' && orderId && (
        <OrderTracker 
          orderId={orderId} 
          orderStatus={orderStatus}
          deliveryOption={deliveryOption}
        />
      )}
    </div>
  )
}
```

### Rewards Dashboard Tab
```typescript
// components/dashboard/RewardsTab.tsx
"use client"

import { useEffect, useState } from 'react'
import PointsDisplay from './PointsDisplay'
import OffersGrid from './OffersGrid'
import TierProgress from './TierProgress'
import RedemptionHistory from './RedemptionHistory'

interface RewardsTabProps {
  userId: string
}

interface RewardsData {
  points: number
  tier: string
  nextTier: string
  pointsToNextTier: number
  offers: Offer[]
  redemptions: Redemption[]
}

export default function RewardsTab({ userId }: RewardsTabProps) {
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        const response = await fetch(`/api/rewards/points?userId=${userId}`, { 
          cache: 'no-store' 
        })
        const data = await response.json()
        setRewardsData(data)
      } catch (error) {
        console.error('Failed to fetch rewards data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRewardsData()
  }, [userId])
  
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="h-32 bg-gray-700 rounded"></div>
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    )
  }
  
  if (!rewardsData) {
    return (
      <div className="text-center py-8 text-gray-400">
        Unable to load rewards data. Please try again.
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-harvest-gold)]">
          Rewards & Loyalty
        </h2>
        <div className="text-sm text-gray-400">
          Member since: {new Date().getFullYear()}
        </div>
      </div>
      
      {/* Points and Tier Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PointsDisplay 
          points={rewardsData.points}
          tier={rewardsData.tier}
        />
        <TierProgress 
          currentTier={rewardsData.tier}
          nextTier={rewardsData.nextTier}
          pointsToNext={rewardsData.pointsToNextTier}
        />
      </div>
      
      {/* Available Offers */}
      <OffersGrid 
        offers={rewardsData.offers}
        userPoints={rewardsData.points}
        onRedeem={(offerId) => {
          // Handle offer redemption
          console.log('Redeeming offer:', offerId)
        }}
      />
      
      {/* Redemption History */}
      <RedemptionHistory redemptions={rewardsData.redemptions} />
    </div>
  )
}
```

### Enhanced Admin Dashboard
```typescript
// app/admin/dashboard/page.tsx
import { requireAdminAuth } from '@/lib/auth/admin'
import LiveOrderFeed from '@/components/admin/LiveOrderFeed'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import ABTestControls from '@/components/admin/ABTestControls'
import RoleManager from '@/components/admin/RoleManager'

export default async function AdminDashboard() {
  const admin = await requireAdminAuth() // Role-based access control
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#1A1A1A] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-[var(--color-harvest-gold)]">
            Admin Dashboard
          </h1>
          <div className="text-sm text-gray-400">
            Role: {admin.role} | Last login: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Live Order Feed */}
          <div className="lg:col-span-2">
            <LiveOrderFeed adminRole={admin.role} />
          </div>
          
          {/* Analytics Dashboard */}
          <div>
            <AnalyticsDashboard />
          </div>
          
          {/* A/B Testing Controls - Super Admin Only */}
          {admin.role === 'super_admin' && (
            <div className="lg:col-span-2">
              <ABTestControls />
            </div>
          )}
          
          {/* Role Management - Super Admin Only */}
          {admin.role === 'super_admin' && (
            <div>
              <RoleManager />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

## 4. API Route Templates

### Menu Drops API
```typescript
// app/api/menu-drops/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { getActiveMenuDrops, createMenuDrop } from '@/lib/api/menu-drops'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    
    // Fetch menu drops based on status (active, scheduled, expired)
    const drops = await getActiveMenuDrops(status)
    return NextResponse.json(drops)
  } catch (error) {
    console.error('Failed to fetch menu drops:', error)
    return NextResponse.json({ error: 'Failed to fetch menu drops' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const dropData = await request.json()
    
    // Validate drop data
    if (!dropData.name || !dropData.items || !dropData.schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create new menu drop with AI scheduling
    const newDrop = await createMenuDrop({
      ...dropData,
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    })
    
    // TODO: Integrate with inventory API for automatic triggers
    // TODO: Set up scheduling with cron jobs or queue system
    
    return NextResponse.json(newDrop, { status: 201 })
  } catch (error) {
    console.error('Failed to create menu drop:', error)
    return NextResponse.json({ error: 'Failed to create menu drop' }, { status: 500 })
  }
}
```

### Stripe Checkout Integration
```typescript
// app/api/checkout/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/auth/session'
import { createOrder } from '@/lib/api/orders'

// TODO: Add Stripe secret key to environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { cartItems, paymentMethodId, deliveryOption, savedCard } = await request.json()
    
    // Calculate total with taxes and fees
    const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.08 // 8% tax rate
    const deliveryFee = deliveryOption === 'otw' ? 2.99 : 0
    const total = subtotal + tax + deliveryFee
    
    // Create order record
    const order = await createOrder({
      userId: user.uid,
      items: cartItems,
      subtotal,
      tax,
      deliveryFee,
      total,
      deliveryOption,
      status: 'pending'
    })
    
    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: cartItems.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description,
            images: item.image ? [item.image] : undefined
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
      metadata: {
        orderId: order.id,
        userId: user.uid
      }
    }
    
    // Add Apple Pay and Google Pay for mobile
    if (request.headers.get('user-agent')?.includes('Mobile')) {
      sessionConfig.payment_method_types.push('apple_pay', 'google_pay')
    }
    
    // Handle saved payment methods
    if (savedCard && paymentMethodId) {
      sessionConfig.payment_method = paymentMethodId
      sessionConfig.customer = user.stripeCustomerId
    }
    
    // Cash on Delivery for Premium members only
    if (deliveryOption === 'cod' && user.membershipTier === 'premium') {
      // Handle COD logic - create order without Stripe session
      return NextResponse.json({ 
        orderId: order.id, 
        paymentMethod: 'cod',
        message: 'Order created for Cash on Delivery' 
      })
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig)
    
    return NextResponse.json({ 
      sessionId: session.id,
      orderId: order.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
```

### Rewards System API
```typescript
// app/api/rewards/points/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { calculateUserRewards, awardPoints } from '@/lib/rewards/calculator'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Ensure user can only access their own data unless admin
    if (userId !== user.uid && user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Calculate user points and tier status
    const rewardsData = await calculateUserRewards(userId || user.uid)
    
    return NextResponse.json({
      points: rewardsData.totalPoints,
      tier: rewardsData.currentTier,
      nextTier: rewardsData.nextTier,
      pointsToNextTier: rewardsData.pointsToNextTier,
      offers: rewardsData.availableOffers,
      redemptions: rewardsData.recentRedemptions,
      history: rewardsData.pointsHistory
    })
  } catch (error) {
    console.error('Failed to fetch rewards data:', error)
    return NextResponse.json({ error: 'Failed to fetch rewards data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { orderId, pointsEarned, action } = await request.json()
    
    // Validate points earning action
    const validActions = ['order_completed', 'review_submitted', 'referral', 'birthday']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Award points for completed action
    const updatedPoints = await awardPoints(user.uid, pointsEarned, {
      action,
      orderId,
      timestamp: new Date().toISOString()
    })
    
    // TODO: Integrate with email service for tier upgrade notifications
    // TODO: Add webhook for external loyalty program integrations
    
    return NextResponse.json({
      success: true,
      newTotal: updatedPoints.totalPoints,
      pointsEarned,
      tierUpgrade: updatedPoints.tierUpgrade || null
    })
  } catch (error) {
    console.error('Failed to award points:', error)
    return NextResponse.json({ error: 'Failed to award points' }, { status: 500 })
  }
}
```

### OTW Integration API
```typescript
// app/api/otw/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkOTWAvailability, calculateDeliveryETA } from '@/lib/otw/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (!address && (!lat || !lng)) {
      return NextResponse.json({ error: 'Address or coordinates required' }, { status: 400 })
    }
    
    // Check OTW rider availability for delivery location
    const availability = await checkOTWAvailability({
      address,
      coordinates: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
    })
    
    if (availability.available) {
      // Calculate estimated delivery time
      const eta = await calculateDeliveryETA(availability.nearestRider, {
        address,
        coordinates: availability.coordinates
      })
      
      return NextResponse.json({
        available: true,
        eta: eta.minutes,
        riderId: availability.nearestRider.id,
        deliveryFee: availability.fee,
        estimatedPickup: eta.pickupTime,
        estimatedDelivery: eta.deliveryTime
      })
    }
    
    return NextResponse.json({
      available: false,
      reason: availability.reason,
      alternativeOptions: availability.alternatives
    })
  } catch (error) {
    console.error('Failed to check OTW availability:', error)
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, deliveryAddress, specialInstructions } = await request.json()
    
    // Create OTW delivery request
    const deliveryRequest = await createOTWDelivery({
      orderId,
      deliveryAddress,
      specialInstructions,
      requestedAt: new Date().toISOString()
    })
    
    // TODO: Integrate with OTW rider dispatch system
    // TODO: Set up real-time tracking webhooks
    
    return NextResponse.json({
      success: true,
      trackingId: deliveryRequest.trackingId,
      estimatedDelivery: deliveryRequest.eta
    })
  } catch (error) {
    console.error('Failed to create OTW delivery:', error)
    return NextResponse.json({ error: 'Failed to create delivery request' }, { status: 500 })
  }
}
```

### Admin Role Management
```typescript
// app/api/admin/roles/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { getAllUsersWithRoles, updateUserRole, auditLog } from '@/lib/api/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth()
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const role = searchParams.get('role')
    
    const users = await getAllUsersWithRoles({ page, limit, role })
    
    return NextResponse.json({
      users: users.data,
      pagination: {
        page,
        limit,
        total: users.total,
        pages: Math.ceil(users.total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch user roles:', error)
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdminAuth()
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const { userId, newRole, reason } = await request.json()
    
    // Validate role
    const validRoles = ['customer', 'premium', 'admin', 'super_admin']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    
    // Prevent self-demotion from super_admin
    if (admin.uid === userId && admin.role === 'super_admin' && newRole !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot demote yourself from super_admin' }, { status: 400 })
    }
    
    const updatedUser = await updateUserRole(userId, newRole)
    
    // Log the role change for audit purposes
    await auditLog({
      action: 'role_change',
      adminId: admin.uid,
      targetUserId: userId,
      oldRole: updatedUser.previousRole,
      newRole,
      reason,
      timestamp: new Date().toISOString()
    })
    
    // TODO: Send notification email to user about role change
    // TODO: Update Firebase custom claims for role-based access
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role updated to ${newRole}`
    })
  } catch (error) {
    console.error('Failed to update user role:', error)
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
}
```

### WebSocket Order Updates
```typescript
// app/api/websocket/orders/route.ts
import { NextRequest } from 'next/server'
import { WebSocketServer } from 'ws'
import { requireAuth } from '@/lib/auth/session'

// TODO: Set up WebSocket server configuration
// This is a placeholder for WebSocket implementation
// In production, consider using Socket.io or a dedicated WebSocket service

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Upgrade HTTP connection to WebSocket
    // Implementation depends on deployment platform (Vercel, Railway, etc.)
    
    return new Response('WebSocket endpoint - upgrade required', {
      status: 426,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade'
      }
    })
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}

// WebSocket message handlers would be implemented here
// TODO: Implement real-time order status updates
// TODO: Add order tracking for delivery updates
// TODO: Set up admin live order feed
```

## 5. Integration Notes

### Environment Variables Required
```bash
# Stripe Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OTW Integration
OTW_API_KEY=otw_...
OTW_API_URL=https://api.otw.com
OTW_SSO_CLIENT_ID=otw_client_...
OTW_SSO_CLIENT_SECRET=otw_secret_...

# WebSocket Configuration
WEBSOCKET_PORT=3001
WEBSOCKET_ORIGIN=http://localhost:3000

# Compliance & Analytics
GDPR_CONSENT_VERSION=1.0
ANALYTICS_API_KEY=analytics_...
```

### Database Schema Extensions
```sql
-- Menu Drops Table
CREATE TABLE menu_drops (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  items JSONB NOT NULL,
  schedule JSONB NOT NULL,
  inventory_trigger JSONB,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  starts_at TIMESTAMP,
  ends_at TIMESTAMP
);

-- Rewards System Tables
CREATE TABLE user_points (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_points INTEGER DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'bronze',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE points_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  order_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Tracking
CREATE TABLE consent_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  consent_type VARCHAR(100) NOT NULL,
  consent_given BOOLEAN NOT NULL,
  version VARCHAR(10) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Caching Strategy
- **Menu Drops**: Redis cache with 5-minute TTL, invalidate on inventory changes
- **Rewards Data**: Cache user points with 1-hour TTL, invalidate on point changes
- **Admin Analytics**: Cache dashboard data with 15-minute TTL
- **OTW Availability**: Cache delivery zones with 30-minute TTL
- **Compliance Data**: No caching for audit trail integrity

### Security Considerations
- **Role-based Access Control**: Implement Firebase custom claims for role verification
- **API Rate Limiting**: Add rate limiting to prevent abuse
- **Data Encryption**: Encrypt sensitive user data at rest
- **GDPR Compliance**: Implement data deletion and export capabilities
- **Audit Logging**: Log all admin actions and sensitive operations

### Performance Optimizations
- **Server Components**: Use for initial page loads and SEO
- **Client Components**: Only for interactive features requiring state
- **Image Optimization**: Use Next.js Image component for all images
- **Code Splitting**: Lazy load admin components and heavy features
- **Database Indexing**: Add indexes for frequently queried fields

This upgrade plan maintains all existing styling and visual elements while significantly enhancing the site's functionality through modern web technologies, real-time features, and comprehensive integrations.