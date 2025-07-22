import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth/session'

// Mock data - replace with actual database operations
const mockMenuDrops = [
  {
    id: '1',
    name: 'Truffle Mac & Cheese Drop',
    description: 'Limited edition truffle-infused mac & cheese with aged gruyere',
    image: '/images/truffle-fries.jpg',
    price: 18.99,
    availableQuantity: 25,
    totalQuantity: 50,
    status: 'active',
    createdAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin'
  },
  {
    id: '2',
    name: 'Wagyu Slider Trio',
    description: 'Three premium wagyu sliders with house-made sauces',
    image: '/images/wagyu-sandwich.jpg',
    price: 24.99,
    availableQuantity: 12,
    totalQuantity: 30,
    status: 'active',
    createdAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin'
  },
  {
    id: '3',
    name: 'Infused Brownie Bites',
    description: 'Premium cannabis-infused chocolate brownies (21+ only)',
    image: '/images/infused-brownie.jpg',
    price: 15.99,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    
    // Filter drops based on status
    const filteredDrops = mockMenuDrops.filter(drop => {
      if (status === 'active') {
        return drop.status === 'active' && new Date(drop.endsAt || '') > new Date()
      }
      if (status === 'scheduled') {
        return drop.status === 'scheduled'
      }
      if (status === 'expired') {
        return drop.status === 'active' && new Date(drop.endsAt || '') <= new Date()
      }
      return drop.status === status
    })
    
    return NextResponse.json({
      drops: filteredDrops,
      total: filteredDrops.length
    })
  } catch (error) {
    console.error('Failed to fetch menu drops:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu drops' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionCookie()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }
    
    // TODO: Check if user has admin role
    // For now, allowing all authenticated users
    
    const dropData = await request.json()
    
    // Validate required fields
    if (!dropData.name || !dropData.description || !dropData.price) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price' }, 
        { status: 400 }
      )
    }
    
    // Create new menu drop
    const newDrop = {
      id: Date.now().toString(), // Simple ID generation
      ...dropData,
      createdBy: session.uid,
      createdAt: new Date().toISOString(),
      status: dropData.scheduledFor ? 'scheduled' : 'active'
    }
    
    // TODO: Save to database
    mockMenuDrops.push(newDrop)
    
    // TODO: Set up scheduling with cron jobs or queue system
    // TODO: Integrate with inventory API for automatic triggers
    // TODO: Send notifications to subscribed users
    
    return NextResponse.json(newDrop, { status: 201 })
  } catch (error) {
    console.error('Failed to create menu drop:', error)
    return NextResponse.json(
      { error: 'Failed to create menu drop' }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionCookie()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const dropId = searchParams.get('id')
    
    if (!dropId) {
      return NextResponse.json(
        { error: 'Drop ID is required' }, 
        { status: 400 }
      )
    }
    
    const updateData = await request.json()
    
    // TODO: Find and update drop in database
    const dropIndex = mockMenuDrops.findIndex(drop => drop.id === dropId)
    
    if (dropIndex === -1) {
      return NextResponse.json(
        { error: 'Menu drop not found' }, 
        { status: 404 }
      )
    }
    
    // Update the drop
    mockMenuDrops[dropIndex] = {
      ...mockMenuDrops[dropIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    return NextResponse.json(mockMenuDrops[dropIndex])
  } catch (error) {
    console.error('Failed to update menu drop:', error)
    return NextResponse.json(
      { error: 'Failed to update menu drop' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionCookie()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const dropId = searchParams.get('id')
    
    if (!dropId) {
      return NextResponse.json(
        { error: 'Drop ID is required' }, 
        { status: 400 }
      )
    }
    
    // TODO: Delete from database
    const dropIndex = mockMenuDrops.findIndex(drop => drop.id === dropId)
    
    if (dropIndex === -1) {
      return NextResponse.json(
        { error: 'Menu drop not found' }, 
        { status: 404 }
      )
    }
    
    mockMenuDrops.splice(dropIndex, 1)
    
    return NextResponse.json({ message: 'Menu drop deleted successfully' })
  } catch (error) {
    console.error('Failed to delete menu drop:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu drop' }, 
      { status: 500 }
    )
  }
}