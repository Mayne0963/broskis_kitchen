import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { adminAuth } from "../../../../../firebase/admin";

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
        const role = decoded.admin ? "admin" : "user";
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
      if (user) token.role = (user as any).role || "USER";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role || "USER";
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };