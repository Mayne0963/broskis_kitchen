export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebase/admin";
import { handleServerError } from "@/lib/utils/errorLogger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get('limit') || 50);
    const limit = Math.min(100, Math.max(1, limitParam));
    const cursorIso = searchParams.get('cursor');
    const cursorTs = cursorIso ? Timestamp.fromDate(new Date(cursorIso)) : null;
    let user = await getServerUser();
    console.log('User authentication check:', user ? `User found: ${user.uid}` : 'No user found');

    if (!user) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      const match = authHeader && authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        try {
          const { adminAuth } = await import('@/lib/firebase/admin');
          const decoded = await adminAuth.verifyIdToken(match[1]);
          user = { uid: decoded.uid, email: decoded.email || null, role: (decoded as any).role || 'user' } as any;
          console.log('Authenticated via Authorization header:', user.uid);
        } catch (e) {
          console.warn('Authorization header verification failed');
        }
      }
    }
    
    // For testing purposes, if no user is found, return some test orders
    // This allows us to test the UI without authentication
    if (!user) {
      console.log('No authenticated user, returning test orders for UI testing');
      const testOrders = [
        {
          id: 'test_order_1',
          userId: 'test_user_1',
          items: [
            { name: 'Broski Burger', price: 15.99, quantity: 2, id: 'item_1' },
            { name: 'Loaded Fries', price: 8.99, quantity: 1, id: 'item_2' }
          ],
          subtotal: 40.97,
          tax: 3.28,
          deliveryFee: 2.99,
          total: 47.24,
          status: 'delivered',
          orderType: 'delivery',
          deliveryAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          },
          contactInfo: {
            email: 'test@example.com',
            phone: '555-1234'
          },
          createdAt: new Date('2024-01-15T12:00:00Z'),
          updatedAt: new Date('2024-01-15T12:30:00Z'),
          estimatedTime: '30-45 minutes'
        },
        {
          id: 'test_order_2',
          userId: 'test_user_1',
          items: [
            { name: 'Chicken Wings', price: 12.99, quantity: 1, id: 'item_3' }
          ],
          subtotal: 12.99,
          tax: 1.04,
          deliveryFee: 0,
          total: 14.03,
          status: 'preparing',
          orderType: 'pickup',
          pickupLocation: 'Main Location',
          contactInfo: {
            email: 'test@example.com',
            phone: '555-1234'
          },
          createdAt: new Date('2024-01-16T14:00:00Z'),
          updatedAt: new Date('2024-01-16T14:00:00Z'),
          estimatedTime: '15-20 minutes'
        }
      ];
      return NextResponse.json({ orders: testOrders });
    }

    console.log(`Fetching orders for user: ${user.uid}`);

    // Validate user data before using in Firestore queries
    if (!user?.uid) {
      console.log('User has no valid uid, returning empty orders');
      return NextResponse.json({ orders: [] });
    }

    // Query orders by userId only (removing userEmail fallback)
    let q = adminDb
      .collection("orders")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (cursorTs) {
      q = q.startAfter(cursorTs);
    }

    const snap = await q.get();

    console.log(`Found ${snap.docs.length} orders for user: ${user.uid}`);
    
    // Debug: log the first few orders to see their structure
    if (snap.docs.length > 0) {
      console.log('First order data:', JSON.stringify(snap.docs[0].data(), null, 2));
    }

    const orders = snap.docs.map(d => {
      const o = d.data() as any;
      return {
        id: d.id,
        userId: o.userId,
        items: o.items || [],
        subtotal: Number(o.subtotal || 0),
        tax: Number(o.tax || 0),
        deliveryFee: Number(o.deliveryFee || 0),
        total: Number(o.total || 0),
        status: o.status || "pending",
        orderType: o.orderType || "pickup",
        deliveryAddress: o.deliveryAddress || null,
        pickupLocation: o.pickupLocation || null,
        contactInfo: o.contactInfo || { email: "", phone: "" },
        paymentInfo: o.paymentInfo || null,
        specialInstructions: o.specialInstructions || "",
        estimatedTime: o.estimatedTime || "",
        createdAt: o.createdAt?.toDate?.() || new Date(),
        updatedAt: o.updatedAt?.toDate?.() || o.createdAt?.toDate?.() || new Date(),
        otwOrderId: o.otwOrderId || null,
        driverInfo: o.driverInfo || null,
        paymentStatus: o.paymentStatus || "pending",
      };
    });

    const last = snap.docs[snap.docs.length - 1];
    const nextCursor = last ? (last.data() as any).createdAt?.toDate?.()?.toISOString?.() : null;

    return NextResponse.json({ orders, nextCursor });
  } catch (error: any) {
    console.error('Order history API error:', error);
    
    // Handle Firestore index errors specifically
    if (error.code === 'FAILED_PRECONDITION' && error.message.includes('requires an index')) {
      const errorMessage = 'Orders are being prepared. Please try again in a moment.';
      console.error('Firestore index required:', error.message);
      return NextResponse.json({ 
        error: errorMessage,
        details: 'Database index is being created. This usually takes a few minutes.'
      }, { status: 500 });
    }
    
    const errorMessage = error.message || 'Failed to fetch orders';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
