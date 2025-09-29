import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

// NextAuth configuration for JWT-based sessions
// This works alongside the existing Firebase Auth setup
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel proxy compatibility
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  providers: [
    // Custom provider to work with Firebase Auth
    {
      id: "firebase",
      name: "Firebase",
      type: "credentials",
      credentials: {
        idToken: { label: "ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) {
          return null;
        }
        
        try {
          // In a real implementation, you would verify the Firebase ID token here
          // For now, we'll return a basic user object
          return {
            id: "firebase-user",
            email: "user@example.com",
          };
        } catch (error) {
          console.error("Firebase auth error:", error);
          return null;
        }
      },
    },
  ],
  
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        session.user.id = token.id;
      }
      
      // Add admin flag based on ALLOWED_ADMIN_EMAILS
      const allowed = (process.env.ALLOWED_ADMIN_EMAILS || "").split(",").map(s=>s.trim().toLowerCase());
      const email = (session.user?.email || "").toLowerCase();
      (session.user as any).isAdmin = allowed.includes(email);
      
      return session;
    },
  },
  
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};