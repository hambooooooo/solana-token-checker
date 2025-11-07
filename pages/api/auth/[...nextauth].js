import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials'; 
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs'; 

// --- THE FIX ---
// Force this route to run on the Node.js runtime, not the Edge.
export const runtime = 'nodejs';
// ---------------

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'Credentials', 
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.passwordHash) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (isValid) {
            return { id: user.id, name: user.name, email: user.email, image: user.image };
          }
        }
        return null; 
      }
    }),
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
      if (token) session.user.id = token.id;
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
};

export default NextAuth(authOptions);