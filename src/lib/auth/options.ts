import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebase/admin";

const ADMIN_LIST = (process.env.ALLOWED_ADMIN_EMAILS || "")
  .split(",")
  .map(v => v.trim().toLowerCase())
  .filter(Boolean);

const isProd = process.env.NODE_ENV === "production";
const domain = isProd ? ".broskiskitchen.com" : undefined;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  cookies: {
    // Helps Safari/Edge cases in prod; harmless locally.
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        ...(domain ? { domain } : {})
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      const email = (user?.email || token?.email || "").toLowerCase();
      token.email = email;
      token.role = ADMIN_LIST.includes(email) ? "admin" : "user";
      if (user?.id) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) || "";
        (session.user as any).role = (token.role as string) || "user";
        (session.user as any).uid = token.uid;
      }
      return session;
    },
  },
  // keep existing providers here (Google/Email/etc)
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
  
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};

export default authOptions;