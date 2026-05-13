import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // @ts-ignore
  turbopack: {},
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql', '@prisma/adapter-better-sqlite3', 'better-sqlite3', 'bcryptjs'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
