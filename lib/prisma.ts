import { PrismaClient } from '@prisma/client';

// The global scope is checked to ensure that the PrismaClient instance
// is not recreated on every hot-reload in development mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Use the Vercel-provided POSTGRES_URL if it exists, otherwise use DATABASE_URL.
// This is the cleanest way to ensure the live environment uses the right key.
const connectionUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl, // Explicitly pass the resolved URL here
      },
    },
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;