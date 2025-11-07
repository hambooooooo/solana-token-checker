import { PrismaClient } from '@prisma/client';

// The global scope is checked to ensure that the PrismaClient instance
// is not recreated on every hot-reload in development mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;