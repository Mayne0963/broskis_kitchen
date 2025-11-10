import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebase/admin";
import { ENV } from "@/lib/env";
import { verifyFirebaseToken, resolveUserRole } from "./firebaseAuth";
import { logAuthDiscrepancyWithMonitoring, shouldHaveAdminAccess } from "./authMonitoring";

export const authOptions: NextAuthOptions = {
  secret: ENV.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: ENV.IS_PROD,
        ...(ENV.COOKIE_DOMAIN ? { domain: ENV.COOKIE_DOMAIN } : {})
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      const email = (user?.email || token?.email || "").toLowerCase();
      token.email = email;
      
      // Store ID token if provided (from Firebase provider)
      if (user?.idToken) {
        token.idToken = user.idToken;
      }
      
      // For Firebase provider or when we have an ID token, verify and get custom claims
      if (token.idToken) {
        try {
          const firebaseClaims = await verifyFirebaseToken(token.idToken as string);
          if (firebaseClaims) {
            const firebaseRole = firebaseClaims.admin ? "admin" : "user";
            const resolvedRole = await resolveUserRole(firebaseClaims.uid, email);
            
            // Log discrepancy if Firebase claims don't match resolved role
            if (firebaseRole !== resolvedRole) {
              logAuthDiscrepancyWithMonitoring(
                "jwt-callback-firebase-mismatch",
                token.sub || token.email || "unknown",
                email,
                firebaseClaims.admin,
                resolvedRole,
                "role_mismatch"
              );
            }
            
            token.role = resolvedRole;
            token.uid = firebaseClaims.uid;
            token.firebaseClaims = firebaseClaims;
          } else {
            // Fallback to email allowlist if Firebase verification fails
            token.role = ENV.ALLOWED_ADMIN_EMAILS.includes(email) ? "admin" : "user";
          }
        } catch (error) {
          console.error("Failed to verify Firebase ID token:", error);
          // Fallback to email allowlist if Firebase verification fails
          token.role = ENV.ALLOWED_ADMIN_EMAILS.includes(email) ? "admin" : "user";
        }
      } else if (token.uid) {
        // If we have a UID but no ID token, try to resolve role from Firebase
        try {
          const resolvedRole = await resolveUserRole(token.uid as string, email);
          token.role = resolvedRole;
        } catch (error) {
          console.error("Failed to resolve user role:", error);
          // Fallback to email allowlist
          token.role = ENV.ALLOWED_ADMIN_EMAILS.includes(email) ? "admin" : "user";
        }
      } else if (user?.id) {
        // For new users, set UID and resolve role
        token.uid = user.id;
        try {
          const resolvedRole = await resolveUserRole(user.id, email);
          token.role = resolvedRole;
        } catch (error) {
          console.error("Failed to resolve user role for new user:", error);
          // Fallback to email allowlist
          token.role = ENV.ALLOWED_ADMIN_EMAILS.includes(email) ? "admin" : "user";
        }
      } else {
        // Keep existing role if already set, otherwise fallback to email allowlist
        token.role = token.role || (ENV.ALLOWED_ADMIN_EMAILS.includes(email) ? "admin" : "user");
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        (session.user as any).role = (token.role as string) || "user";
        (session.user as any).uid = token.uid;
      }
      return session;
    },
  },
  // keep existing providers here (Google/Email/etc)
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // For demo purposes - in production, verify against your user database
          // This is a simplified example - implement proper password verification
          const email = credentials.email.toLowerCase();
          const isAdmin = ENV.ALLOWED_ADMIN_EMAILS.includes(email);
          
          if (!isAdmin) {
            return null;
          }
          
          // In production, verify password against hashed password in database
          // For now, allowing any password for admin emails (SECURITY RISK - FIX IN PRODUCTION)
          return {
            id: email,
            email: email,
            name: email,
            emailVerified: true,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
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
            idToken: credentials.idToken, // Store ID token for JWT callback
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