import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/adminOnly'
import { adminDb } from '@/lib/firebase/admin'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = searchParams.get('sort') || 'createdAt'
    const dir = searchParams.get('dir') || 'desc'
    const includeTotal = searchParams.get('includeTotal') === 'true'

    // Build query
    let query = adminDb.collection('menuDrops')

    // Apply status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    // Apply sorting
    query = query.orderBy(sort, dir as 'asc' | 'desc')

    // Apply cursor pagination
    if (cursor) {
      const cursorDoc = await adminDb.collection('menuDrops').doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    // Apply limit
    query = query.limit(limit)

    const snapshot = await query.get()
    const menuDrops = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime?.toDate?.()?.toISOString() || doc.data().startTime,
      endTime: doc.data().endTime?.toDate?.()?.toISOString() || doc.data().endTime,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }))

    // Get total count if requested
    let total: number | undefined
    if (includeTotal) {
      let countQuery = adminDb.collection('menuDrops')
      if (status && status !== 'all') {
        countQuery = countQuery.where('status', '==', status)
      }
      const countSnapshot = await countQuery.count().get()
      total = countSnapshot.data().count
    }

    // Determine next cursor
    const nextCursor = snapshot.docs.length === limit 
      ? snapshot.docs[snapshot.docs.length - 1].id 
      : null

    return NextResponse.json({
      menuDrops,
      pagination: {
        nextCursor,
        hasMore: snapshot.docs.length === limit,
        limit
      },
      filters: {
        status,
        sort,
        dir
      },
      ...(total !== undefined && { total })
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
    // Verify admin authentication
    const decoded = await requireAdmin(request)

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.description || typeof data.price !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price' },
        { status: 400 }
      )
    }

    if (typeof data.totalQuantity !== 'number' || data.totalQuantity <= 0) {
      return NextResponse.json(
        { error: 'totalQuantity must be a positive number' },
        { status: 400 }
      )
    }

    // Validate dates
    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startTime or endTime' },
        { status: 400 }
      )
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'endTime must be after startTime' },
        { status: 400 }
      )
    }

    // Determine status based on dates
    const now = new Date()
    let status: string
    if (startTime > now) {
      status = 'scheduled'
    } else if (endTime > now) {
      status = 'active'
    } else {
      status = 'ended'
    }

    const menuDropData = {
      name: data.name,
      description: data.description,
      price: data.price,
      totalQuantity: data.totalQuantity,
      soldQuantity: 0,
      revenue: 0,
      status,
      startTime: adminDb.Timestamp.fromDate(startTime),
      endTime: adminDb.Timestamp.fromDate(endTime),
      category: data.category || 'special',
      image: data.image || '',
      createdBy: decoded.uid,
      createdAt: adminDb.Timestamp.now(),
      updatedAt: adminDb.Timestamp.now()
    }

    const docRef = await adminDb.collection('menuDrops').add(menuDropData)
    const newDoc = await docRef.get()
    
    const newMenuDrop = {
      id: newDoc.id,
      ...newDoc.data(),
      startTime: newDoc.data()?.startTime?.toDate?.()?.toISOString(),
      endTime: newDoc.data()?.endTime?.toDate?.()?.toISOString(),
      createdAt: newDoc.data()?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: newDoc.data()?.updatedAt?.toDate?.()?.toISOString()
    }

    return NextResponse.json(newMenuDrop, { status: 201 })
  } catch (error) {
    console.error('Failed to create menu drop:', error)
    return NextResponse.json(
      { error: 'Failed to create menu drop' },
      { status: 500 }
    )
  }
}