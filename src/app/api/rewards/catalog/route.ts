import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { getUserRewards } from '@/lib/services/rewardsService'

// Static rewards catalog - NEW PROFIT LOGIC
const REWARDS_CATALOG = [
  {
    id: 'free_side_100',
    name: 'Free Side',
    description: 'Get any side dish for free',
    pointsCost: 100,
    category: 'food',
    type: 'free_item',
    value: 'side_dish',
    maxCogsValue: 2.00, // Max COGS $2
    active: true
  },
  {
    id: 'free_dessert_150',
    name: 'Free Dessert',
    description: 'Get any dessert for free',
    pointsCost: 150,
    category: 'food',
    type: 'free_item',
    value: 'dessert',
    maxCogsValue: 4.00, // Max COGS $4
    active: true
  },
  {
    id: 'discount_10pct_300',
    name: '10% Off',
    description: 'Get 10% off food subtotal only',
    pointsCost: 300,
    category: 'discount',
    type: 'percentage_discount',
    value: 10,
    maxCogsValue: null, // No COGS cap for percentage discounts
    active: true
  },
  {
    id: 'hat_400',
    name: 'Broski Hat',
    description: 'Get a Broski branded hat',
    pointsCost: 400,
    category: 'merchandise',
    type: 'merchandise',
    value: 'hat',
    maxCogsValue: 8.00, // Max cost $8
    active: true
  },
  {
    id: 'free_burger_500',
    name: 'Free Burger',
    description: 'Get any burger for free',
    pointsCost: 500,
    category: 'food',
    type: 'free_item',
    value: 'burger',
    maxCogsValue: 6.00, // Max COGS $6
    active: true
  },
  {
    id: 'shirt_600',
    name: 'Broski Shirt',
    description: 'Get a Broski branded shirt',
    pointsCost: 600,
    category: 'merchandise',
    type: 'merchandise',
    value: 'shirt',
    maxCogsValue: 12.00, // Max cost $12
    active: true
  },
  {
    id: 'discount_20pct_700',
    name: '20% Off',
    description: 'Get 20% off food subtotal only',
    pointsCost: 700,
    category: 'discount',
    type: 'percentage_discount',
    value: 20,
    maxCogsValue: null, // No COGS cap for percentage discounts
    active: true
  },
  {
    id: 'cookbook_1000',
    name: 'Broski Cookbook',
    description: 'Get the official Broski cookbook',
    pointsCost: 1000,
    category: 'merchandise',
    type: 'merchandise',
    value: 'cookbook',
    maxCogsValue: 20.00, // Max cost $20
    active: true
  }
]

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }
    const userId = user.uid
    
    // Get user rewards to check current points
    const userRewards = await getUserRewards(userId)
    const userPoints = userRewards?.totalPoints || 0
    
    // Filter active rewards and add affordability info
    const enrichedRewards = REWARDS_CATALOG
      .filter(reward => reward.active)
      .map(reward => ({
        ...reward,
        canAfford: userPoints >= reward.pointsCost,
        userPoints
      }))
    
    // Sort by category and points cost
    const sortedRewards = enrichedRewards.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.pointsCost - b.pointsCost
    })
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' }
    return new NextResponse(JSON.stringify({
      success: true,
      catalog: sortedRewards,
      userPoints,
      totalRewards: sortedRewards.length
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Catalog error:', error)
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'