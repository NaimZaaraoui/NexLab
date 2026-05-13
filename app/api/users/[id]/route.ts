import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;


    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { action, name, role } = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    if (action === 'toggle-active') {
      // Prevent deactivating self
      if (session.user.id === id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas désactiver votre propre compte.' },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
      }

      // Prevent deactivating the last admin
      if (user.role === 'ADMIN' && user.isActive) {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true },
        });

        if (adminCount <= 1) {
          return NextResponse.json(
            { error: 'Vous ne pouvez pas désactiver le dernier administrateur.' },
            { status: 400 }
          );
        }
      }

      await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
      });

      await createAuditLog({
        action: user.isActive ? 'user.deactivate' : 'user.activate',
        severity: user.isActive ? 'WARN' : 'INFO',
        entity: 'user',
        entityId: id,
        details: {
          targetUserEmail: user.email,
          targetUserRole: user.role,
          isActiveAfter: !user.isActive,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json({ message: 'Statut mis à jour.' });
    }

    if (action === 'reset-password') {
      const hashedPassword = await bcrypt.hash('NexLab2026!', 12);
      await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
        },
      });

      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { email: true, role: true },
      });

      await createAuditLog({
        action: 'user.reset_password',
        severity: 'WARN',
        entity: 'user',
        entityId: id,
        details: {
          targetUserEmail: targetUser?.email || null,
          targetUserRole: targetUser?.role || null,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json({ message: 'Mot de passe réinitialisé.' });
    }

    if (action === 'update') {
      const validRoles = ['ADMIN', 'MEDECIN', 'TECHNICIEN', 'RECEPTIONNISTE'];
      if (role && !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id },
        data: { name, role },
      });

      await createAuditLog({
        action: 'user.update',
        severity: 'INFO',
        entity: 'user',
        entityId: id,
        details: { name, role },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json({ message: 'Informations mises à jour.' });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}
