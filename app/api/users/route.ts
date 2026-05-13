import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

export async function GET() {
  try {
    const session = await auth();

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires.' },
        { status: 400 }
      );
    }

    const validRoles = ['ADMIN', 'MEDECIN', 'TECHNICIEN', 'RECEPTIONNISTE'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    const meta = getRequestMeta({ headers: request.headers });
    await createAuditLog({
      action: 'user.create',
      severity: 'INFO',
      entity: 'user',
      entityId: user.id,
      details: {
        createdUserEmail: user.email,
        createdUserRole: user.role,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}
