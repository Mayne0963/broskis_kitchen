import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/orders",
  "/loyalty",
  "/rewards",
  "/cart",
  "/checkout",
  "/admin",
];
const AUTH_ROUTES = ["/auth/login", "/auth/signup", "/login", "/signup"];
const ADMIN_PREFIX = "/admin";

function decodeFirebaseSession(cookieValue?: string) {
  if (!cookieValue) return null;
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    );
    return payload as {
      uid?: string;
      email?: string;
      email_verified?: boolean;
      role?: string;
      permissions?: string[];
    };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 100% bypass for auth pages and next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/static") ||
    pathname === "/" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/loyalty") ||
    pathname.startsWith("/rewards") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/403") ||
    pathname.startsWith("/404") ||
    pathname.startsWith("/500") ||
    pathname === "/dashboard"
  ) {
    return NextResponse.next();
  }

  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const firebaseCookie = req.cookies.get("__session")?.value;
  const firebaseUser = !nextAuthToken ? decodeFirebaseSession(firebaseCookie) : null;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isSignedIn = Boolean(nextAuthToken || firebaseUser);

  // protected pages need auth
  if (isProtected && !isSignedIn) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // admin needs role
  if (pathname.startsWith(ADMIN_PREFIX)) {
    const role = (nextAuthToken as any)?.role || firebaseUser?.role;
    if (!isSignedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") return NextResponse.redirect(new URL("/403", req.url));
  }

  const res = NextResponse.next();
  if (nextAuthToken) {
    res.headers.set("x-user-id", nextAuthToken.sub || "");
    if ((nextAuthToken as any).role) res.headers.set("x-user-role", (nextAuthToken as any).role);
  } else if (firebaseUser) {
    if (firebaseUser.uid) res.headers.set("x-user-id", firebaseUser.uid);
    if (firebaseUser.email) res.headers.set("x-user-email", firebaseUser.email);
    if (firebaseUser.email_verified !== undefined)
      res.headers.set("x-email-verified", String(firebaseUser.email_verified));
    if (firebaseUser.role) res.headers.set("x-user-role", firebaseUser.role);
  }
  return res;
}

export const config = {
  // Exclude static assets including audio files from middleware
  matcher: ["/((?!_next|static|favicon.ico|audio).*)"],
};