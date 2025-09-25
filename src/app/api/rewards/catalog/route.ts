import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { getUserRewards } from '@/lib/services/rewardsService'

// Static rewards catalog
const REWARDS_CATALOG = [
  {
    id: 'free_side_100',
    name: 'Free Side Dish',
    description: 'Get any side dish for free',
    pointsCost: 100,
    category: 'food',
    type: 'free_item',
    value: 'side_dish',
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
    active: true
  },
  {
    id: 'discount_10pct_300',
    name: '10% Off Order',
    description: 'Get 10% off your entire order',
    pointsCost: 300,
    category: 'discount',
    type: 'percentage_discount',
    value: 10,
    active: true
  },
  {
    id: 'free_entree_500',
    name: 'Free Entree',
    description: 'Get any entree for free',
    pointsCost: 500,
    category: 'food',
    type: 'free_item',
    value: 'entree',
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