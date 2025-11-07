import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials'; 
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs'; 

// CRITICAL FIX: If DATABASE_URL is missing, use POSTGRES_URL from Vercel/Neon
// This ensures Prisma can always find the correct connection string.
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

export const authOptions = {
  // Database Adapter Configuration
  adapter: PrismaAdapter(prisma),
  
  // ------------------------------------
  // PROVIDERS: Credentials and Google
  // ------------------------------------
  providers: [
    // 1. Credentials Provider (Email/Password) - Used for Sign-In
    CredentialsProvider({
      name: 'Credentials', 
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        // 1. Look up user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 2. Check if user exists AND if password is valid using bcrypt
        if (user && user.passwordHash) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          
          if (isValid) {
            // Return user object if credentials are correct
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            };
          }
        }
        
        // Return null if user not found or password incorrect
        return null; 
      }
    }),
    
    // 2. Social Provider (Google)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  
  // ------------------------------------
  // SESSION & JWT
  // ------------------------------------
  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // Add user ID to the session object
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    // Add user ID to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  
  // ------------------------------------
  // CONFIGURATION
  // ------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: '/auth/signin', // Directs to your custom page
    error: '/auth/signin',   // Redirects errors (like bad password) back to the custom page
  },
};

export default NextAuth(authOptions);