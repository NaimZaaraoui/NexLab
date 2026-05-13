import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLicenseStatus, getMachineId } from '@/lib/license';

export async function GET() {
  try {
    const status = await getLicenseStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[License API GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve license status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { licenseKey } = await request.json();

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    // Upsert the license key in the settings table
    const existing = await prisma.setting.findUnique({ where: { key: 'license_key' } });
    
    if (existing) {
      await prisma.setting.update({
        where: { key: 'license_key' },
        data: { value: licenseKey }
      });
    } else {
      await prisma.setting.create({
        data: {
          key: 'license_key',
          value: licenseKey
        }
      });
    }

    // Verify if the newly submitted key actually works
    const newStatus = await getLicenseStatus();
    
    if (!newStatus.isValid) {
      // It was saved, but it's not valid for this machine
      return NextResponse.json({ 
        success: false, 
        message: 'Clé enregistrée, mais elle est invalide ou expirée.',
        status: newStatus 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Licence activée avec succès.',
      status: newStatus 
    });

  } catch (error) {
    console.error('[License API POST] Error:', error);
    return NextResponse.json({ error: 'Failed to update license key' }, { status: 500 });
  }
}
