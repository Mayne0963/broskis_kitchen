import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * Streamlined NextAuth configuration with zero extra fetches
 * - Computes admin role once in JWT callback
 * - Uses server-side rendering for admin gates
 * - Eliminates client-side polling and double checks
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { 
    strategy: "jwt", 
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 12     // 12 hours
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".broskiskitchen.com" : undefined
      }
    }
  },
  
  providers: [
    CredentialsProvider({
      id: "firebase",
      name: "Firebase",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          return null;
        }
        
        try {
          // Verify Firebase ID token
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
          
          return {
            id: decodedToken.uid,
            email: decodedToken.email || "",
            name: decodedToken.name || decodedToken.email || "",
            emailVerified: decodedToken.email_verified || false,
          };
        } catch (error) {
          console.error("Firebase auth error:", error);
          return null;
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Attach role once during initial sign-in
      if (user?.email) {
        const email = user.email.toLowerCase();
        const admins = (process.env.ALLOWED_ADMIN_EMAILS || "")
          .toLowerCase().split(",").map(s => s.trim());
        token.role = admins.includes(email) ? "admin" : "user";
        token.email = email;
        token.uid = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Pass role from JWT to session (no extra fetches)
      (session.user as any).role = token.role || "user";
      (session.user as any).uid = token.uid;
      return session;
    },
  },
  
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};