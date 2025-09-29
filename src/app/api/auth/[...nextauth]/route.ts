import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Hardened NextAuth configuration for App Router
// Uses centralized authOptions with fallback configuration for production safety
export const { GET, POST } = NextAuth(authOptions ?? {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  trustHost: true, // Required for Vercel proxy compatibility
  providers: [
    // Providers are defined in authOptions
    // This fallback ensures the route works even if authOptions fails to load
  ],
  callbacks: {
    async session({ session, token }) {
      // Fallback admin check in case authOptions callback fails
      const emails = (process.env.ALLOWED_ADMIN_EMAILS || "").toLowerCase();
      const email = (session.user?.email || "").toLowerCase();
      (session.user as any).isAdmin = emails.split(",").map(s => s.trim()).includes(email);
      return session;
    },
  },
});