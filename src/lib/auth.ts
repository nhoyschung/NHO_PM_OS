import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';

declare module 'next-auth' {
  interface User {
    role: string;
    departmentId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      departmentId: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // DrizzleAdapter skipped: credentials provider + JWT strategy does not
  // invoke adapter CRUD methods, and our users table uses uuid PKs with
  // custom columns that diverge from Auth.js defaults. Direct DB queries
  // in authorize() are the recommended pattern for credentials-only auth.
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
          with: { role: true },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role.name,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.departmentId = token.departmentId as string | null;
      return session;
    },
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
});
