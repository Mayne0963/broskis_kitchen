import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { rewardId, points } = body;

    // Validate input
    if (!rewardId || !points || typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid reward ID or points amount" },
        { status: 400 }
      );
    }

    // Call Firebase Function
    const redeemPoints = httpsCallable(functions, 'redeemPoints');
    const result = await redeemPoints({
      uid: user.uid,
      rewardId,
      points
    });

    const data = result.data as any;

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: "Reward redeemed successfully",
        redemptionCode: data.redemptionCode,
        newBalance: data.newBalance,
        expiresAt: data.expiresAt
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || "Redemption failed" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Redemption error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (error.code === 'functions/permission-denied') {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 }
      );
    }
    
    if (error.code === 'functions/invalid-argument') {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}