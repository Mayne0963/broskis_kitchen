import { NextResponse } from "next/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  // We'll use a server-only environment variable without the  prefix
  // This ensures it's never bundled with client code
  const hasApiKey = !!process.env.GOOGLE_MAPS_API_KEY

  return NextResponse.json({
    hasApiKey,
  })
}
