import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type AppRole = "ADMIN" | "MEMBER";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;

        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
          select: { id: true, username: true, passwordHash: true, role: true },
        });

        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.username,
          email: null,
          role: user.role as AppRole,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      const roleFromUser = (user as any)?.role as AppRole | undefined;
      if (user) {
        (token as typeof token & { role?: AppRole }).role = roleFromUser;
      }

      if (token.sub && !(token as typeof token & { role?: AppRole }).role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (dbUser) (token as typeof token & { role?: AppRole }).role = dbUser.role as AppRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = (token as typeof token & { role?: "ADMIN" | "MEMBER" }).role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
