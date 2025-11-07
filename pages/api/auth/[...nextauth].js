// path: pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

// Force NodeJS runtime
export const runtime = 'nodejs';

/** @type {import('next-auth').AuthOptions} */
export const authOptions = {
  // Only use Prisma adapter when DATABASE_URL is present to avoid runtime crashes
  adapter: process.env.DATABASE_URL ? PrismaAdapter(prisma) : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Missing credentials');
          }

          // Defensive: ensure email is a string
          const email = String(credentials.email).toLowerCase();

          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });

          if (!user || !user.hashedPassword) {
            // Return null to let NextAuth handle a failed auth without 500
            return null;
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isCorrectPassword) {
            return null;
          }

          return user;
        } catch (err) {
          console.error('Credentials authorize error:', err);
          // Fail authentication gracefully instead of causing a 500
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    // error: '/auth/error', // Optional: custom error page
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  events: {
    error: (message) => {
      // NextAuth will call this for unhandled errors; log the payload for debugging
      console.error('NextAuth event error:', message);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);