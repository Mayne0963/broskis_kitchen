import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/account",
  "/orders",
  "/loyalty",
  "/rewards",
  "/cart",
  "/checkout",
  "/admin",
];
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
      admin?: boolean;
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
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const firebaseCookie = req.cookies.get("__session")?.value;
  const firebaseUser = !nextAuthToken ? decodeFirebaseSession(firebaseCookie) : null;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isSignedIn = Boolean(nextAuthToken || firebaseUser);

  if (isProtected && !isSignedIn) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const role = (nextAuthToken as any)?.role || firebaseUser?.role;
    const adminFlag = (nextAuthToken as any)?.admin === true || firebaseUser?.admin === true;
    if (!isSignedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!(role === "admin" || adminFlag)) return NextResponse.redirect(new URL("/403", req.url));
  }

  const res = NextResponse.next();
  if (nextAuthToken) {
    res.headers.set("x-user-id", nextAuthToken.sub || "");
    const nextAuthIsAdmin = (nextAuthToken as any).role === "admin" || (nextAuthToken as any).admin === true;
    if (nextAuthIsAdmin) {
      res.headers.set("x-user-role", "admin");
    } else if ((nextAuthToken as any).role) {
      res.headers.set("x-user-role", (nextAuthToken as any).role);
    }
  } else if (firebaseUser) {
    if (firebaseUser.uid) res.headers.set("x-user-id", firebaseUser.uid);
    if (firebaseUser.email) res.headers.set("x-user-email", firebaseUser.email);
    if (firebaseUser.email_verified !== undefined)
      res.headers.set("x-email-verified", String(firebaseUser.email_verified));
    const firebaseIsAdmin = firebaseUser.role === "admin" || firebaseUser.admin === true;
    if (firebaseIsAdmin) {
      res.headers.set("x-user-role", "admin");
    } else if (firebaseUser.role) {
      res.headers.set("x-user-role", firebaseUser.role);
    }
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};