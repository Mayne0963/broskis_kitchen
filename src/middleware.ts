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

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  try {
    return atob(padded);
  } catch {
    return "";
  }
}

function decodeFirebaseSession(cookieValue?: string | null) {
  if (!cookieValue) return null as any;
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 3) return null as any;
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);
    return payload;
  } catch {
    return null as any;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/static") ||
    pathname === "/" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const firebaseCookie = req.cookies.get("__session")?.value ?? null;
  const firebaseUser = !nextAuthToken ? decodeFirebaseSession(firebaseCookie) : null;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isSignedIn = Boolean(nextAuthToken || firebaseUser);

  if (isProtected && !isSignedIn) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isSignedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const role = (nextAuthToken as any)?.role || (firebaseUser as any)?.role;
    if (!isSignedIn) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  const res = NextResponse.next();
  if (nextAuthToken) {
    res.headers.set("x-user-id", (nextAuthToken as any).sub || "");
    const role = (nextAuthToken as any).role;
    if (role) res.headers.set("x-user-role", role);
  } else if (firebaseUser) {
    const uid = (firebaseUser as any)?.uid;
    const email = (firebaseUser as any)?.email;
    const emailVerified = (firebaseUser as any)?.email_verified;
    const role = (firebaseUser as any)?.role;
    if (uid) res.headers.set("x-user-id", uid);
    if (email) res.headers.set("x-user-email", email);
    if (emailVerified !== undefined) res.headers.set("x-email-verified", String(emailVerified));
    if (role) res.headers.set("x-user-role", role);
  }

  return res;
}

export const config = { matcher: ["/((?!_next|static|favicon.ico).*)"] };