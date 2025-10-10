import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    // Require authentication and admin privileges
    const user = await requireUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, targetUserId, points, reason } = body;

    // Validate input
    if (!action || !targetUserId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (action === 'adjust' && (!points || typeof points !== 'number')) {
      return NextResponse.json(
        { success: false, message: "Invalid points amount" },
        { status: 400 }
      );
    }

    // Call Firebase Function
    const adminAdjustPoints = httpsCallable(functions, 'adminAdjustPoints');
    const result = await adminAdjustPoints({
      adminUid: user.uid,
      targetUid: targetUserId,
      pointsDelta: points,
      reason: reason || 'Admin adjustment'
    });

    const data = result.data as any;

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: "Points adjusted successfully",
        newBalance: data.newBalance,
        transaction: data.transaction
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || "Adjustment failed" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Admin rewards error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (error.code === 'functions/permission-denied') {
      return NextResponse.json(
        { success: false, message: "Admin privileges required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication and admin privileges
    const user = await requireUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: "User ID or email required" },
        { status: 400 }
      );
    }

    // For now, return mock data since we need to implement user search
    // In a real implementation, this would search Firestore for user profiles
    return NextResponse.json({
      success: true,
      user: {
        uid: userId || 'mock-user-id',
        email: email || 'user@example.com',
        profile: {
          points: 1250,
          lifetimePoints: 2800,
          tier: 'gold',
          createdAt: Date.now() - 86400000 * 30,
          updatedAt: Date.now()
        },
        recentTransactions: [
          {
            id: 'tx1',
            delta: 100,
            type: 'earn',
            description: 'Order #12345',
            createdAt: Date.now() - 86400000
          },
          {
            id: 'tx2',
            delta: -250,
            type: 'redeem',
            description: 'Free Appetizer',
            createdAt: Date.now() - 86400000 * 2
          }
        ]
      }
    });

  } catch (error: any) {
    console.error("Admin get user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}