import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth/session'
import { 
  getAllMenuDrops,
  getMenuDropsByStatus,
  createMenuDrop,
  updateMenuDrop,
  deleteMenuDrop,
  MenuDrop
} from '@/lib/services/menuDropsService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let drops: MenuDrop[]
    
    if (status) {
      drops = await getMenuDropsByStatus(status)
    } else {
      drops = await getAllMenuDrops()
    }
    
    return NextResponse.json({
      drops,
      total: drops.length
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
    const newDrop = await createMenuDrop({
      ...dropData,
      createdBy: session.uid,
      status: dropData.scheduledFor ? 'scheduled' : 'active',
      soldQuantity: 0,
      revenue: 0
    })
    
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
    
    // Update the drop
    const updatedDrop = await updateMenuDrop(dropId, updateData)
    
    if (!updatedDrop) {
      return NextResponse.json(
        { error: 'Menu drop not found' }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedDrop)
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
    
    // Delete from database
    const deleted = await deleteMenuDrop(dropId)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Menu drop not found' }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Menu drop deleted successfully' })
  } catch (error) {
    console.error('Failed to delete menu drop:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu drop' }, 
      { status: 500 }
    )
  }
}