export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ensureAdmin, adminDb } from '@/lib/firebase/admin';

const ALLOWED_STATUSES = [
  'pending',
  'preparing', 
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled'
] as const;

type OrderStatus = typeof ALLOWED_STATUSES[number];

interface UpdateOrderRequest {
  status: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure admin access - ensureAdmin throws Response on failure
    await ensureAdmin(req);

    // Extract order ID from route parameters
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: UpdateOrderRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { ok: false, error: 'Status field is required' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!ALLOWED_STATUSES.includes(body.status as OrderStatus)) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Update order in Firestore
    await adminDb.collection('orders').doc(id).update({
      status: body.status,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      ok: true,
      success: true,
      id,
      status: body.status
    });

  } catch (error) {
    // Handle ensureAdmin Response throws
    if (error instanceof Response) {
      return error;
    }
    
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}