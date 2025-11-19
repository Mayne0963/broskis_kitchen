export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
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
    
    // Try to resolve uid from email if uid is missing but email is present
    if (!user?.uid && user?.email) {
      try {
        const userSnap = await adminDb
          .collection(COLLECTIONS.USERS)
          .where('email', '==', user.email)
          .limit(1)
          .get();
        if (userSnap.docs.length > 0) {
          const resolvedUid = userSnap.docs[0].id;
          user = { ...(user as any), uid: resolvedUid } as any;
          console.log(`[my-orders] Resolved uid from email ${user.email}: ${resolvedUid}`);
        }
      } catch (resolveErr) {
        console.warn('[my-orders] Failed to resolve uid from email:', resolveErr);
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
      return NextResponse.json({ orders: testOrders, pathUsed: 'test_orders' });
    }

    console.log(`Fetching orders for user: ${user.uid}`);

    // Validate user data before using in Firestore queries
    if (!user?.uid) {
      console.log('User has no valid uid, returning empty orders');
      return NextResponse.json({ orders: [] });
    }

    const ordersCollection = adminDb.collection(COLLECTIONS.ORDERS);
    type PathUsed = 'orders_by_uid' | 'orders_by_email' | 'user_subcollection' | 'collection_group' | 'test_orders';
    let pathUsed: PathUsed = 'orders_by_uid';

    let q = ordersCollection
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (cursorTs) {
      q = q.startAfter(cursorTs);
    }

    let snap = await q.get();
    console.log(`[my-orders] uid query returned ${snap.docs.length} docs for ${user.uid}`);
    
    // Debug: log the first few orders to see their structure
    if (snap.docs.length > 0) {
      console.log('First order data:', JSON.stringify(snap.docs[0].data(), null, 2));
    }

    // Fallback: some legacy/orders may store uid under the field name "uid"
    if (snap.docs.length === 0) {
      try {
        let byUid = ordersCollection
          .where('uid', '==', user.uid)
          .orderBy('createdAt', 'desc')
          .limit(limit);
        if (cursorTs) byUid = byUid.startAfter(cursorTs);
        const uidSnap = await byUid.get();
        if (uidSnap.docs.length > 0) {
          snap = uidSnap as any;
          pathUsed = 'orders_by_uid';
          console.log(`[my-orders] Fallback by field "uid" succeeded with ${uidSnap.docs.length} docs for ${user.uid}`);
        }
      } catch (uidErr: any) {
        console.warn('[my-orders] uid field fallback failed:', uidErr?.message || uidErr);
      }
    }

    if (snap.docs.length === 0 && user.email) {
      const emailCandidates = Array.from(
        new Set(
          [user.email, user.email?.toLowerCase?.() || null].filter(Boolean)
        )
      ) as string[];

      for (const candidate of emailCandidates) {
        console.log(`[my-orders] UID lookup empty. Attempting email fallback for ${candidate}`);
        // Try userEmail (normalized field), then raw email field
        let emailQuery = ordersCollection
          .where("userEmail", "==", candidate)
          .orderBy("createdAt", "desc")
          .limit(limit);
        if (cursorTs) {
          emailQuery = emailQuery.startAfter(cursorTs);
        }
        const emailSnap = await emailQuery.get();
        if (emailSnap.docs.length > 0) {
          snap = emailSnap as any;
          pathUsed = 'orders_by_email';
          console.log(`[my-orders] Email fallback (userEmail) succeeded with ${emailSnap.docs.length} docs for ${candidate}`);
          break;
        }

        // Try raw email field used by some test/fallback writes
        let rawEmailQuery = ordersCollection
          .where('email', '==', candidate)
          .orderBy('createdAt', 'desc')
          .limit(limit);
        if (cursorTs) rawEmailQuery = rawEmailQuery.startAfter(cursorTs);
        const rawEmailSnap = await rawEmailQuery.get();
        if (rawEmailSnap.docs.length > 0) {
          snap = rawEmailSnap as any;
          pathUsed = 'orders_by_email';
          console.log(`[my-orders] Email fallback (email) succeeded with ${rawEmailSnap.docs.length} docs for ${candidate}`);
          break;
        }

        // Try lowercased email field if present
        let lowerEmailQuery = ordersCollection
          .where('userEmailLower', '==', candidate.toLowerCase())
          .orderBy('createdAt', 'desc')
          .limit(limit);
        if (cursorTs) lowerEmailQuery = lowerEmailQuery.startAfter(cursorTs);
        const lowerEmailSnap = await lowerEmailQuery.get();
        if (lowerEmailSnap.docs.length > 0) {
          snap = lowerEmailSnap as any;
          pathUsed = 'orders_by_email';
          console.log(`[my-orders] Email fallback (userEmailLower) succeeded with ${lowerEmailSnap.docs.length} docs for ${candidate}`);
          break;
        }
      }

      if (pathUsed !== 'orders_by_email') {
        console.warn(`[my-orders] Email fallback returned no orders for user ${user.uid}`);
      }
    }

    if (snap.docs.length === 0) {
      try {
        let userOrdersQuery = adminDb
          .collection(COLLECTIONS.USERS)
          .doc(user.uid)
          .collection(COLLECTIONS.ORDERS)
          .orderBy("createdAt", "desc")
          .limit(limit);

        if (cursorTs) {
          userOrdersQuery = userOrdersQuery.startAfter(cursorTs);
        }

        const userOrdersSnap = await userOrdersQuery.get();
        if (userOrdersSnap.docs.length > 0) {
          snap = userOrdersSnap as any;
          pathUsed = 'user_subcollection';
          console.log(`[my-orders] User orders subcollection fallback succeeded with ${userOrdersSnap.docs.length} docs for ${user.uid}`);
        } else {
          console.warn(`[my-orders] User orders subcollection fallback returned no orders for user ${user.uid}`);
        }
      } catch (subErr: any) {
        console.warn(`[my-orders] User orders subcollection fallback failed for ${user.uid}:`, subErr?.message || subErr);
      }
    }

    // Additional fallback: check user subcollections via collection group
    if (snap.docs.length === 0) {
      try {
        let q3 = adminDb
          .collectionGroup(COLLECTIONS.ORDERS)
          .where("userId", "==", user.uid)
          .orderBy("createdAt", "desc")
          .limit(limit);
        if (cursorTs) {
          q3 = q3.startAfter(cursorTs);
        }
        const snap3 = await q3.get();
        if (snap3.docs.length > 0) {
          console.log(`Collection group fallback found ${snap3.docs.length} orders for user: ${user.uid}`);
          snap = snap3 as any;
          pathUsed = 'collection_group';
        }
      } catch (cgErr: any) {
        console.warn('Collection group query failed or requires index:', cgErr?.message || cgErr);
      }
    }

    const orders = snap.docs.map(d => {
      const o = d.data() as any;
      const status = typeof o.status === 'string' ? o.status : 'pending';
      const createdAt =
        o.createdAt?.toDate?.() ||
        (typeof o.createdAt === 'string' ? new Date(o.createdAt) : new Date());
      const updatedAt =
        o.updatedAt?.toDate?.() ||
        (typeof o.updatedAt === 'string' ? new Date(o.updatedAt) : createdAt);
      const normalizedItems = Array.isArray(o.items) ? o.items.map((it: any) => ({
        name: it?.name ?? it?.title ?? 'Item',
        quantity: Number(it?.quantity ?? it?.qty ?? 1),
        price: Number(
          typeof it?.price === 'number' ? it.price :
          typeof it?.priceCents === 'number' ? (it.priceCents / 100) : 0
        ),
      })) : [];
      const orderType = o.orderType ?? o.type ?? 'pickup';
      const contactInfo = o.contactInfo ?? { email: o.userEmail ?? '', phone: o.userPhone ?? '', name: o.userName ?? '' };
      const normalizedUserId = o.userId ?? o.uid ?? o.customerId ?? user.uid;
      return {
        id: d.id,
        userId: normalizedUserId,
        items: normalizedItems,
        subtotal: Number(o.subtotal ?? 0),
        tax: Number(o.tax ?? 0),
        deliveryFee: Number(o.deliveryFee ?? 0),
        total: Number(o.total ?? (Number(o.subtotal ?? 0) + Number(o.tax ?? 0) + Number(o.deliveryFee ?? 0))),
        status,
        orderType,
        deliveryAddress: o.deliveryAddress ?? null,
        pickupLocation: o.pickupLocation ?? null,
        contactInfo,
        paymentInfo: o.paymentInfo ?? null,
        specialInstructions: o.specialInstructions ?? "",
        estimatedTime: o.estimatedTime ?? "",
        createdAt,
        updatedAt,
        otwOrderId: o.otwOrderId ?? null,
        driverInfo: o.driverInfo ?? null,
        paymentStatus: o.paymentStatus ?? "pending",
      };
    });

    const last = snap.docs[snap.docs.length - 1];
    const nextCursor = last ? (last.data() as any).createdAt?.toDate?.()?.toISOString?.() : null;
    console.log(`my-orders response: { pathUsed: ${pathUsed}, count: ${orders.length}, nextCursor: ${nextCursor} }`);
    return NextResponse.json({ orders, nextCursor, pathUsed }, { headers: { 'Cache-Control': 'no-store' } });
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
    
    handleServerError(error, 'my-orders');
    const errorMessage = error.message || 'Failed to fetch orders';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
