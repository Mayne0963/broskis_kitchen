import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { adminAuth, db } from "@/lib/firebase/admin";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Firebase",
      credentials: { idToken: { label: "idToken", type: "text" } },
      async authorize(credentials) {
        const idToken = credentials?.idToken;
        if (!idToken) return null;
        
        // Verify once with Firebase Admin on login
        const decoded = await adminAuth.verifyIdToken(idToken);
        
        // 1) Source A: custom claim on token
        let role: "admin" | "user" = decoded.admin ? "admin" : "user";
        
        // 2) Source B: Firestore users/{uid} (OR-logic)
        try {
          const ref = db.collection("users").doc(decoded.uid);
          const snap = await ref.get();
          if (snap.exists) {
            const data = snap.data() || {};
            const raw = (data.role ?? data.Role ?? "").toString().toLowerCase();
            const flag = !!(data.admin || data.ADMIN || data.isAdmin);
            if (raw === "admin" || flag) role = "admin";
          }
        } catch (e) {
          console.error("Firestore role read failed:", e);
        }
        
        // always return lowercase role
        return {
          id: decoded.uid,
          email: decoded.email,
          name: decoded.name ?? decoded.email?.split("@")[0],
          role,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = ((user as any).role ?? "user").toLowerCase?.() ?? "user";
      
      // Optional: background role refresh (every 60 minutes)
      const now = Math.floor(Date.now() / 1000);
      if (!("lastRoleCheck" in token)) (token as any).lastRoleCheck = 0;
      if (now - (token as any).lastRoleCheck > 3600 && token?.sub) {
        try {
          const ref = db.collection("users").doc(token.sub);
          const snap = await ref.get();
          if (snap.exists) {
            const data = snap.data() || {};
            const raw = (data.role ?? data.Role ?? "").toString().toLowerCase();
            const flag = !!(data.admin || data.ADMIN || data.isAdmin);
            const next = raw === "admin" || flag ? "admin" : "user";
            (token as any).role = next;
          }
        } catch (e) {
          console.warn("Role refresh (Firestore) failed:", e);
        }
        (token as any).lastRoleCheck = now;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = ((token as any).role ?? "user").toLowerCase?.() ?? "user";
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };