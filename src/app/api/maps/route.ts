import { NextResponse } from "next/server"

export async function GET() {
  // We'll use a server-only environment variable without the NEXT_PUBLIC_ prefix
  // This ensures it's never bundled with client code
  const hasApiKey = !!process.env.GOOGLE_MAPS_API_KEY

  return NextResponse.json({
    hasApiKey,
  })
}
