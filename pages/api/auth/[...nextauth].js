import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
// --- FIX THE IMPORT PATHS ---
// Change to use relative paths which always work
import { prisma } from '../../../lib/prisma';
// ----------------------------

export const authOptions = {
  // 1. Tell Auth.js to use your Vercel Postgres database
  adapter: PrismaAdapter(prisma),

  // 2. Define the authentication providers (Google, etc.)
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // ... (the rest of the file remains the same)
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // ...
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  }
};

export default NextAuth(authOptions);