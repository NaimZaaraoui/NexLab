import { PrismaClient } from '../app/generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set.');

  const clientConfig: any = {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  };

  if (process.env.DATABASE_ENCRYPTION_KEY) {
    clientConfig.encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
  }

  const adapter = new PrismaLibSql(clientConfig);

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;