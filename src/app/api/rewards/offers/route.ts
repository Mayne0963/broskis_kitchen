import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  getAllRewardOffers,
  createUserRedemption,
  getUserRewards,
  updateUserRewards,
  addPointsTransaction
} from '@/lib/services/rewardsService'

// Mock data fallback
const mockOffers = [
  {
    id: '1',
    title: 'Free Appetizer',
    description: 'Get any appetizer on the house',
    pointsCost: 500,
    type: 'food',
    category: 'appetizer',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    maxRedemptions: 100,
    currentRedemptions: 23,
    terms: 'Valid for dine-in and takeout. Cannot be combined with other offers.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20appetizer%20platter%20with%20wings%20and%20dips&image_size=square'
  },
  {
    id: '2',
    title: '20% Off Next Order',
    description: 'Save 20% on your entire next order',
    pointsCost: 750,
    type: 'discount',
    category: 'percentage',
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    isActive: true,
    maxRedemptions: 50,
    currentRedemptions: 12,
    terms: 'Valid for orders over $25. Cannot be combined with other discounts.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=discount%20coupon%20with%2020%20percent%20off%20text&image_size=square'
  },
  {
    id: '3',
    title: 'Free Delivery',
    description: 'Get free delivery on your next order',
    pointsCost: 300,
    type: 'service',
    category: 'delivery',
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    isActive: true,
    maxRedemptions: 200,
    currentRedemptions: 87,
    terms: 'Valid for delivery orders only. Minimum order value $15.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=delivery%20truck%20with%20free%20delivery%20text&image_size=square'
  },
  {
    id: '4',
    title: 'Double Points Weekend',
    description: 'Earn 2x points on all orders this weekend',
    pointsCost: 1000,
    type: 'bonus',
    category: 'points',
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    isActive: true,
    maxRedemptions: 25,
    currentRedemptions: 8,
    terms: 'Valid for weekend orders only (Friday-Sunday). Points will be credited within 24 hours.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20coins%20with%20double%20points%20text&image_size=square'
  },
  {
    id: '5',
    title: 'Free Dessert',
    description: 'Choose any dessert from our menu',
    pointsCost: 400,
    type: 'food',
    category: 'dessert',
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    isActive: true,
    maxRedemptions: 75,
    currentRedemptions: 34,
    terms: 'Valid for dine-in and takeout. One dessert per redemption.',
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20chocolate%20cake%20dessert&image_size=square'
  }
]

const mockUserRedemptions = {
  'mock-user-id': [
    {
      id: 'red-1',
      offerId: '1',
      offerTitle: 'Free Appetizer',
      pointsUsed: 500,
      redeemedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'used',
      usedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      orderId: 'BK-1234567890'
    },
    {
      id: 'red-2',
      offerId: '3',
      offerTitle: 'Free Delivery',
      pointsUsed: 300,
      redeemedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'active',
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'red-3',
      offerId: '2',
      offerTitle: '20% Off Next Order',
      pointsUsed: 750,
      redeemedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      status: 'expired',
      expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    }
  ]
}

// GET /api/rewards/offers - Get available offers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    // Get offers from Firebase
    let filteredOffers = await getAllRewardOffers()
    
    // Filter by type
    if (type) {
      filteredOffers = filteredOffers.filter(offer => offer.type === type)
    }
    
    // Filter by category
    if (category) {
      filteredOffers = filteredOffers.filter(offer => offer.category === category)
    }
    
    // Filter by active status
    if (activeOnly) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.isActive && 
        offer.validUntil > new Date() &&
        offer.currentRedemptions < offer.maxRedemptions
      )
    }
    
    // Sort by points cost (ascending)
    filteredOffers.sort((a, b) => a.pointsCost - b.pointsCost)
    
    return NextResponse.json({
      offers: filteredOffers,
      total: filteredOffers.length
    })
    
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/rewards/offers - Redeem an offer
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // TODO: Verify session and get actual user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    const body = await request.json()
    const { offerId } = body
    
    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      )
    }
    
    // Get all offers to find the specific one
    const offers = await getAllRewardOffers()
    const offer = offers.find(o => o.id === offerId)
    
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }
    
    // Check if offer is still valid
    if (!offer.isActive || offer.validUntil <= new Date()) {
      return NextResponse.json(
        { error: 'Offer is no longer available' },
        { status: 400 }
      )
    }
    
    // Check if offer has reached max redemptions
    if (offer.currentRedemptions >= offer.maxRedemptions) {
      return NextResponse.json(
        { error: 'Offer has reached maximum redemptions' },
        { status: 400 }
      )
    }
    
    // Check user's points balance
    const userRewards = await getUserRewards(userId)
    if (!userRewards || userRewards.points < offer.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }
    
    // Deduct points from user's account
    await addPointsTransaction({
      userId,
      type: 'redeemed',
      points: -offer.pointsCost,
      description: `Redeemed: ${offer.title}`,
      date: new Date()
    })
    
    // Update user rewards
    await updateUserRewards(userId, {
      points: userRewards.points - offer.pointsCost,
      redeemedPoints: userRewards.redeemedPoints + offer.pointsCost
    })
    
    // Create redemption record
    const redemption = await createUserRedemption({
      userId,
      offerId: offer.id,
      offerTitle: offer.title,
      pointsUsed: offer.pointsCost,
      redeemedAt: new Date(),
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      code: `BK${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    })
    
    return NextResponse.json({
      success: true,
      redemption,
      message: `Successfully redeemed ${offer.title}!`,
      pointsDeducted: offer.pointsCost
    })
    
  } catch (error) {
    console.error('Error redeeming offer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/rewards/offers/redemptions - Get user's redemption history
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // TODO: Verify session and get actual user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // TODO: Replace with actual database query
    let redemptions = mockUserRedemptions[userId as keyof typeof mockUserRedemptions] || []
    
    // Filter by status
    if (status) {
      redemptions = redemptions.filter(r => r.status === status)
    }
    
    // Sort by redemption date (newest first)
    redemptions.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())
    
    // Apply pagination
    const paginatedRedemptions = redemptions.slice(offset, offset + limit)
    
    return NextResponse.json({
      redemptions: paginatedRedemptions,
      total: redemptions.length,
      hasMore: offset + limit < redemptions.length
    })
    
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}