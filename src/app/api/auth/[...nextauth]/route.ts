import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Use centralized auth options for consistent configuration
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };