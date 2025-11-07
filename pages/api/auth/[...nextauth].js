import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../../../lib/prisma'; // Already fixed to relative path

// ------------------------------------------------------------------
// FIX: Revert to standard adapter now that the Prisma client (in lib/prisma.ts)
// is correctly configured to use the right environment variable.
// ------------------------------------------------------------------

export const authOptions = {
  // Use the standard adapter, which now relies on the globally configured Prisma client.
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