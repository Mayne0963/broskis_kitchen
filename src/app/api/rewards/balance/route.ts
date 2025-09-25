import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'
import { handleError } from '@/lib/error'
import { getUserRewards } from '@/lib/services/rewardsService'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getServerUser()
    if (!user) return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
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
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({
      success: true,
      points: userRewards.totalPoints,
      totalEarned: userRewards.totalEarned || 0,
      totalRedeemed: userRewards.totalRedeemed || 0,
      totalSpins: userRewards.totalSpins || 0,
      canSpin,
      nextSpinAt: nextSpinAt?.toISOString() || null,
      lastSpinDate: userRewards.lastSpinDate?.toISOString() || null,
      expiringPoints: 0 // Simplified for now
    }), { status: 200, headers })
    
  } catch (error) {
    console.error('Balance error:', error)
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 })
  }
}