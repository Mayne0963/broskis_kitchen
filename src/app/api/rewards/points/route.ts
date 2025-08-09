import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  getUserRewards, 
  createUserRewards, 
  updateUserRewards,
  addPointsTransaction,
  getUserPointsHistory
} from '@/lib/services/rewardsService'

// GET /api/rewards/points - Get user's rewards data
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // TODO: Verify session and get actual user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('includeHistory') === 'true'
    
    // Get user rewards from Firebase
    let userRewards = await getUserRewards(userId)
    
    // Create rewards record if it doesn't exist
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    const response: any = {
      ...userRewards,
      userId
    }
    
    if (includeHistory) {
      response.history = await getUserPointsHistory(userId, 50)
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching rewards data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/rewards/points - Award points to user
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // TODO: Verify session and get actual user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    const body = await request.json()
    const { points, type, description, orderId, referralId, promotionId } = body
    
    // Validate input
    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { error: 'Valid points amount is required' },
        { status: 400 }
      )
    }
    
    if (!type || !['earned', 'bonus', 'referral'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type is required (earned, bonus, referral)' },
        { status: 400 }
      )
    }
    
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    
    // Get current user rewards
    let userRewards = await getUserRewards(userId)
    
    // Create rewards record if it doesn't exist
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    // Create points transaction
    const pointsEntry = await addPointsTransaction({
      userId,
      type,
      points,
      description,
      date: new Date(),
      orderId,
      referralId,
      promotionId
    })
    
    // Update user rewards
    const newPoints = userRewards.points + points
    const newLifetimePoints = userRewards.lifetimePoints + points
    
    const updatedRewards = await updateUserRewards(userId, {
      points: newPoints,
      lifetimePoints: newLifetimePoints
    })
    
    return NextResponse.json({
      success: true,
      pointsAdded: points,
      newBalance: newPoints,
      entry: pointsEntry,
      tierUpgrade: false // TODO: Implement tier upgrade logic
    })
    
  } catch (error) {
    console.error('Error awarding points:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/rewards/points - Deduct points (for redemptions)
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // TODO: Verify session and get actual user ID
    const userId = 'mock-user-id' // Replace with actual user ID from session
    
    const body = await request.json()
    const { points, description, redemptionId } = body
    
    // Validate input
    if (!points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { error: 'Valid points amount is required' },
        { status: 400 }
      )
    }
    
    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    
    // Get current user rewards
    let userRewards = await getUserRewards(userId)
    
    // Create rewards record if it doesn't exist
    if (!userRewards) {
      userRewards = await createUserRewards(userId)
    }
    
    if (userRewards.points < points) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }
    
    // Create points transaction for deduction
    const pointsEntry = await addPointsTransaction({
      userId,
      type: 'redeemed',
      points: -points,
      description,
      date: new Date(),
      redemptionId
    })
    
    // Update user rewards
    const newPoints = userRewards.points - points
    const newRedeemedPoints = userRewards.redeemedPoints + points
    
    const updatedRewards = await updateUserRewards(userId, {
      points: newPoints,
      redeemedPoints: newRedeemedPoints
    })
    
    return NextResponse.json({
      success: true,
      pointsDeducted: points,
      newBalance: newPoints,
      entry: pointsEntry
    })
    
  } catch (error) {
    console.error('Error deducting points:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}