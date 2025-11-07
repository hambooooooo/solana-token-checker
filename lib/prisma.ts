import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the prisma client
// This prevents multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use the existing instance or create a new one
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

// Save the instance to the global object in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;