import { PrismaClient } from '../app/generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set.');

  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;