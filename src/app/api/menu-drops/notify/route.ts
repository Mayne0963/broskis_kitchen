import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/session'

export const dynamic = 'force-dynamic';

// Mock notification subscriptions - replace with actual database
const mockNotifications: { [key: string]: string[] } = {}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' }, 
        { status: 401 }
      )
    }
    
    const { dropId, action } = await request.json()
    
    if (!dropId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: dropId, action' }, 
        { status: 400 }
      )
    }
    
    if (!['subscribe', 'unsubscribe'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "subscribe" or "unsubscribe"' }, 
        { status: 400 }
      )
    }
    
    // Initialize notifications array for this drop if it doesn't exist
    if (!mockNotifications[dropId]) {
      mockNotifications[dropId] = []
    }
    
    const userIndex = mockNotifications[dropId].indexOf(user.uid)
    
    if (action === 'subscribe') {
      if (userIndex === -1) {
        mockNotifications[dropId].push(user.uid)
        
        // TODO: Store notification preference in database
        // TODO: Add user to email/SMS notification list
        // TODO: Send confirmation email/SMS
        
        const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
        return new NextResponse(JSON.stringify({
          message: 'Successfully subscribed to notifications',
          subscribed: true,
          totalSubscribers: mockNotifications[dropId].length
        }), { status: 200, headers })
      } else {
        const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
        return new NextResponse(JSON.stringify({
          message: 'Already subscribed to notifications',
          subscribed: true,
          totalSubscribers: mockNotifications[dropId].length
        }), { status: 200, headers })
      }
    } else { // unsubscribe
      if (userIndex !== -1) {
        mockNotifications[dropId].splice(userIndex, 1)
        
        // TODO: Remove notification preference from database
        // TODO: Remove user from email/SMS notification list
        
        const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
        return new NextResponse(JSON.stringify({
          message: 'Successfully unsubscribed from notifications',
          subscribed: false,
          totalSubscribers: mockNotifications[dropId].length
        }), { status: 200, headers })
      } else {
        const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
        return new NextResponse(JSON.stringify({
          message: 'Not subscribed to notifications',
          subscribed: false,
          totalSubscribers: mockNotifications[dropId].length
        }), { status: 200, headers })
      }
    }
  } catch (error) {
    console.error('Failed to handle notification request:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' }, 
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const dropId = searchParams.get('dropId')
    
    if (!dropId) {
      return NextResponse.json(
        { error: 'Drop ID is required' }, 
        { status: 400 }
      )
    }
    
    const subscribers = mockNotifications[dropId] || []
    const isSubscribed = subscribers.includes(user.uid)
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({
      subscribed: isSubscribed,
      totalSubscribers: subscribers.length
    }), { status: 200, headers })
  } catch (error) {
    console.error('Failed to get notification status:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL' }, 
      { status: 500 }
    )
  }
}

// Admin endpoint to send notifications
export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED' }, 
        { status: 401 }
      )
    }
    
    // TODO: Check if user has admin role
    
    const { dropId, message, type } = await request.json()
    
    if (!dropId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: dropId, message' }, 
        { status: 400 }
      )
    }
    
    const subscribers = mockNotifications[dropId] || []
    
    if (subscribers.length === 0) {
      const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({
      message: 'No subscribers to notify',
      notificationsSent: 0
    }), { status: 200, headers })
    }
    
    // TODO: Send notifications to all subscribers
    // This could include:
    // - Email notifications
    // - SMS notifications
    // - Push notifications
    // - In-app notifications
    
    console.log(`Sending ${type || 'general'} notification to ${subscribers.length} users for drop ${dropId}:`, message)
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({
      message: 'Notifications sent successfully',
      notificationsSent: subscribers.length,
      subscribers: subscribers.length
    }), { status: 200, headers })
  } catch (error) {
    console.error('Failed to send notifications:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL' }, 
      { status: 500 }
    )
  }
}