import { NextResponse } from "next/server";
import { mintTokensForUser } from "@/lib/rewards/mintTokens";
import { verifyAdminAccess } from "@/lib/auth/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and has admin role
    const adminVerification = await verifyAdminAccess();
    if (!adminVerification.success) {
      return NextResponse.json({ 
        error: adminVerification.error || "FORBIDDEN" 
      }, { 
        status: adminVerification.error === "Authentication required" ? 401 : 403 
      });
    }

    const { userId, isVip, spentUsdLast24h, profileComplete } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "MISSING_USER_ID" }, { status: 400 });
    }

    const tokensCreated = await mintTokensForUser(userId, {
      isVip: Boolean(isVip),
      spentUsdLast24h: Number(spentUsdLast24h) || 0,
      profileComplete: Boolean(profileComplete)
    });

    return NextResponse.json({ 
      ok: true, 
      tokensCreated,
      message: `Successfully minted ${tokensCreated} eligibility tokens for user ${userId}`
    });
  } catch (error) {
    console.error("Error minting tokens:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}