import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // If you need to use the Google Maps API key in middleware,
  // use the server-only environment variable
  // const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

  // Only apply to infused menu paths
  if (path.startsWith("/infused-menu")) {
    // Add security headers
    const response = NextResponse.next()

    // Add security headers
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.set("Permissions-Policy", "camera=self")

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/infused-menu/:path*"],
}
