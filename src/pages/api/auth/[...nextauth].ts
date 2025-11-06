import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user) return null;
          const isValid = await compare(credentials.password, (user as any).password);
          if (!isValid) return null;
          return {
            id: String((user as any).id),
            name: (user as any).name || (user as any).email,
            email: (user as any).email,
            role: (user as any).role ?? "user",
          } as any;
        } catch (e) {
          // Fallback: deny if Prisma not available
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role || "user";
      }
      return token as any;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role || "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);