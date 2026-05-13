import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { newPassword } = await request.json();
    const meta = getRequestMeta({ headers: request.headers });

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({


      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    await createAuditLog({
      action: 'auth.change_password',
      severity: 'INFO',
      entity: 'user',
      entityId: session.user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}
