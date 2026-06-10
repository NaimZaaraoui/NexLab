import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === '1';
const isDocker = process.env.BUILD_TARGET === 'docker';

const nextConfig: NextConfig = {
  // standalone is required for Docker but breaks Vercel deployment
  output: isVercel ? undefined : 'standalone',
  // @ts-ignore
  turbopack: {},
  serverExternalPackages: isVercel
    ? ['@libsql/client', '@prisma/adapter-libsql', 'bcryptjs']
    : ['@libsql/client', '@prisma/adapter-libsql', '@prisma/adapter-better-sqlite3', 'better-sqlite3', 'bcryptjs'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
