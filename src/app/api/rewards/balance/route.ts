import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { handleError } from '@/lib/error'
import { getUserRewards } from '@/lib/services/rewardsService'

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(req)
    const userId = user.uid
    
    // Get user rewards
    const userRewards = await getUserRewards(userId)
    
    if (!userRewards) {
      return NextResponse.json({
        success: false,
        error: 'User rewards profile not found'
      }, { status: 404 })
    }
    
    // Calculate if user can spin (24 hour cooldown)
    const now = new Date()
    const lastSpin = userRewards.lastSpinDate ? new Date(userRewards.lastSpinDate) : null
    const canSpin = !lastSpin || (now.getTime() - lastSpin.getTime()) >= 24 * 60 * 60 * 1000
    const nextSpinAt = lastSpin ? new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000) : null
    
    return NextResponse.json({
      success: true,
      points: userRewards.totalPoints,
      totalEarned: userRewards.totalEarned || 0,
      totalRedeemed: userRewards.totalRedeemed || 0,
      totalSpins: userRewards.totalSpins || 0,
      canSpin,
      nextSpinAt: nextSpinAt?.toISOString() || null,
      lastSpinDate: userRewards.lastSpinDate?.toISOString() || null,
      expiringPoints: 0 // Simplified for now
    })
    
  } catch (error) {
    console.error('Balance error:', error)
    const errorResponse = handleError(error)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}