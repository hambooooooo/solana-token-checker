import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';

// ------------------------------------------------------------------
// FINAL FIX: Auth.js automatically checks process.env.DATABASE_URL.
// Since we have POSTGRES_URL, we set the DATABASE_URL to POSTGRES_URL 
// only if it's missing, forcing Auth.js to use the correct key.
// ------------------------------------------------------------------

if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
    // If DATABASE_URL is not set (which is what Prisma looks for), 
    // we use the Neon-provided POSTGRES_URL
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

export const authOptions = {
  // Now, Prisma/Auth.js will correctly initialize the adapter 
  // because we've set DATABASE_URL, which the standard adapter expects.
  adapter: PrismaAdapter(prisma), 
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  
  session: {
    strategy: 'jwt',
  },
  
  callbacks: {
    // ... (rest of callbacks are unchanged)
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
    // If the crash persists, we need to inspect the actual error page.
    error: '/api/auth/error' // Ensure this is set to the default if you remove custom error handling
  }
};

export default NextAuth(authOptions);