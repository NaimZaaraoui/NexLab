import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit } from '@/lib/security/rate-limit';

export const ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIEN: 'TECHNICIEN',
  RECEPTIONNISTE: 'RECEPTIONNISTE',
  MEDECIN: 'MEDECIN',
} as const;

export type Role = keyof typeof ROLES;

export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'],
  TECHNICIEN: [
    '/',
    '/analyses',
    '/analyses/nouvelle',
    '/analyses/:id',
    '/dashboard/qc',
    '/dashboard/temperature',
    '/dashboard/patients',
    '/dashboard/inventory',
    '/dashboard/documents',
  ],
  RECEPTIONNISTE: [
    '/',
    '/analyses',
    '/analyses/nouvelle',
    '/dashboard/qc',
    '/dashboard/temperature',
    '/dashboard/patients',
    '/dashboard/inventory',
    '/dashboard/documents',
  ],
  MEDECIN: [
    '/',
    '/analyses',
    '/dashboard/qc',
    '/dashboard/temperature',
    '/dashboard/inventory',
    '/dashboard/documents',
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: { strategy: 'jwt' },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-auth.session-token' : 'auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax', // Bloque les requêtes POST cross-origin (CSRF protection)
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials, request) {
        const ip = request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip') || 'unknown';
        const isAllowed = await checkRateLimit(ip);
        
        if (!isAllowed) {
          throw new Error('Trop de tentatives. Veuillez réessayer plus tard.');
        }

        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;
        if (!user.isActive) throw new Error("Compte désactivé");

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }

      if (trigger === 'update' && session) {
        token.mustChangePassword = session.mustChangePassword;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mustChangePassword = token.mustChangePassword;
      }
      return session;
    },
  },
});
