import { prisma } from '@/lib/db/prisma';
import { jwtVerify } from 'jose';
import { randomUUID } from 'crypto';

const LICENSE_SECRET = new TextEncoder().encode('nexlab_super_secret_vendor_key_2026_!@#$');

export interface LicenseStatus {
  isValid: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'INVALID' | 'NO_LICENSE';
  expiresAt: Date | null;
  machineId: string;
}

export async function getMachineId(): Promise<string> {
  // Try to find machine_id in settings
  let setting = await prisma.setting.findUnique({ where: { key: 'machine_id' } });
  
  if (!setting) {
    // Generate one on first run and save it permanently
    const newId = `NXL-${randomUUID().slice(0, 8).toUpperCase()}-${randomUUID().slice(9, 13).toUpperCase()}`;
    setting = await prisma.setting.create({
      data: {
        key: 'machine_id',
        value: newId
      }
    });
  }
  
  return setting.value;
}

export async function getLicenseStatus(): Promise<LicenseStatus> {
  try {
    if (process.env.DEMO_MODE === 'true') {
      return {
        isValid: true,
        status: 'ACTIVE',
        expiresAt: null,
        machineId: 'NXL-DEMO',
      };
    }

    const machineId = await getMachineId();
    const licenseSetting = await prisma.setting.findUnique({ where: { key: 'license_key' } });
    
    if (!licenseSetting || !licenseSetting.value) {
      return { isValid: false, status: 'NO_LICENSE', expiresAt: null, machineId };
    }

    // Verify JWT
    try {
      const { payload } = await jwtVerify(licenseSetting.value, LICENSE_SECRET);
      
      // Check machine binding
      if (payload.machineId !== machineId) {
         return { isValid: false, status: 'INVALID', expiresAt: null, machineId };
      }

      // Check expiration manually (jwtVerify also checks 'exp' automatically if present)
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        if (expDate < new Date()) {
          return { isValid: false, status: 'EXPIRED', expiresAt: expDate, machineId };
        }
        return { isValid: true, status: 'ACTIVE', expiresAt: expDate, machineId };
      }

      // Lifetime license
      return { isValid: true, status: 'ACTIVE', expiresAt: null, machineId };

    } catch (e) {
      // JWT verification failed (expired, tampered, bad signature)
      if (e instanceof Error && e.message.includes('expired')) {
         return { isValid: false, status: 'EXPIRED', expiresAt: null, machineId };
      }
      return { isValid: false, status: 'INVALID', expiresAt: null, machineId };
    }

  } catch (error) {
    console.error('License check error:', error);
    return { isValid: false, status: 'INVALID', expiresAt: null, machineId: 'ERROR' };
  }
}
