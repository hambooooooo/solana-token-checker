import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../../../lib/prisma'; // Already fixed to relative path

// --- FINAL FIX: Overriding the database URL in the adapter ---
const customAdapter = PrismaAdapter(prisma);

// We manually inject the Vercel-provided POSTGRES_URL into the adapter's options
// This is the cleanest way to resolve the conflict when Vercel provides many DB URLs.
const finalAdapter = {
  ...customAdapter,
  // This line forces the adapter to use the POSTGRES_URL from the Vercel environment.
  options: {
    ...customAdapter.options,
    url: process.env.POSTGRES_URL, 
  },
};
// -------------------------------------------------------------

export const authOptions = {
  // Use the new, configured adapter
  adapter: finalAdapter,
  
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