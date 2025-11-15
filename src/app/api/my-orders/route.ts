export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebase/admin";
import { handleServerError } from "@/lib/utils/errorLogger";

export async function GET() {
  try {
    const user = await getServerUser();
    console.log('User authentication check:', user ? `User found: ${user.uid}` : 'No user found');
    
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
    if (!user.uid && !user.email) {
      console.log('User has no valid uid or email, returning empty orders');
      return NextResponse.json({ orders: [] });
    }

    let snap;
    
    // Try to find orders by userId first, if available
    if (user.uid) {
      snap = await adminDb
        .collection("orders")
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    }

    // If no orders found by userId, try by email (if available and different from uid)
    if ((!snap || snap.empty) && user.email && user.email !== user.uid) {
      console.log(`No orders found by userId, trying email: ${user.email}`);
      snap = await adminDb
        .collection("orders")
        .where("userEmail", "==", user.email)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    }

    // Handle case where no valid queries were executed
    if (!snap) {
      console.log('No valid user data to query orders');
      return NextResponse.json({ orders: [] });
    }

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

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Order history API error:', error);
    const errorMessage = error.message || 'Failed to fetch orders';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
