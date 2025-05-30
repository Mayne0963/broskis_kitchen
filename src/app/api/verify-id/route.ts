import { NextResponse } from "next/server"
import { verifyIDWithAI } from "../../../lib/services/openai"
import { storeVerificationStatus } from "../../../lib/services/firebase"

export async function POST(request: Request) {
  try {
    const { idImage, selfieImage, userId } = await request.json()

    if (!idImage || !selfieImage || !userId) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Verify ID using OpenAI
    const verificationResult = await verifyIDWithAI(idImage, selfieImage)

    // If verification is successful, store the status in Firebase
    if (verificationResult.success) {
      try {
        const expiryDays = process.env.AGE_VERIFICATION_EXPIRY_DAYS
          ? Number.parseInt(process.env.AGE_VERIFICATION_EXPIRY_DAYS)
          : 30

        await storeVerificationStatus(userId, true, expiryDays)
      } catch (error) {
        console.error("Error storing verification status:", error)
        // Continue even if storing fails, as we'll use localStorage as fallback
      }
    }

    return NextResponse.json(verificationResult)
  } catch (error) {
    console.error("Error in ID verification API:", error)
    return NextResponse.json({ success: false, message: "An error occurred during verification" }, { status: 500 })
  }
}