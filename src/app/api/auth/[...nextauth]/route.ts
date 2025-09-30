export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Use centralized auth options for consistent configuration
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };