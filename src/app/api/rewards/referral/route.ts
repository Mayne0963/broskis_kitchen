import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Call Firebase Function to get referral code
    const getReferralCode = httpsCallable(functions, 'getReferralCode');
    const result = await getReferralCode({
      uid: user.uid
    });

    const data = result.data as any;

    if (data.success) {
      return NextResponse.json({
        success: true,
        referralCode: data.referralCode,
        referralStats: data.stats || {
          totalReferrals: 0,
          successfulReferrals: 0,
          totalPointsEarned: 0
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to get referral code" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Get referral code error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { referralCode, orderId } = body;

    // Validate input
    if (!referralCode || !orderId) {
      return NextResponse.json(
        { success: false, message: "Referral code and order ID required" },
        { status: 400 }
      );
    }

    // Call Firebase Function to process referral bonus
    const processReferralBonus = httpsCallable(functions, 'processReferralBonus');
    const result = await processReferralBonus({
      newUserUid: user.uid,
      referralCode,
      orderId
    });

    const data = result.data as any;

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: "Referral bonus processed successfully",
        bonusAwarded: data.bonusAwarded,
        referrerBonus: data.referrerBonus,
        newUserBonus: data.newUserBonus
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || "Referral processing failed" },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("Process referral error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'functions/unauthenticated') {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (error.code === 'functions/invalid-argument') {
      return NextResponse.json(
        { success: false, message: "Invalid referral code or order" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}