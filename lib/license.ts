import { prisma } from '@/lib/prisma';
import { jwtVerify, importSPKI } from 'jose';
import { randomUUID } from 'crypto';

// The public key corresponding to our private vendor key.
// In a real product, keep this hardcoded securely or in .env (if you want to rotate it).
// For NexLab, we use a fixed valid RSA RS256 public key.
const NEXLAB_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyK+P6QdZ+C4F1hQ8O0/o
Y5G3Q1xUa9zYQ0k+JvU7v3XJ+nI0m3pZ1eY2BqP2C5I+K2K2H2H2H2H2H2H2H2H2
-----END PUBLIC KEY-----`; // Placeholder for real verification. For simplicity we'll use HS256 with a unique server secret if RSA isn't strictly needed locally.

// Actually, since we want true offline without complicated RSA setups for this MVP, 
// a robust HMAC secret derived from a strong internal phrase is often enough to stop standard users,
// but RS256 prevents anyone who extracts the secret from generating their own keys.
// We'll use a mocked RS256 public key or fall back to a simple HMAC for demonstration if RSA format fails.
// Let's use a symmetric secret for this implementation to keep dependencies zero-config for the user,
// or we assume they will not decompile the NextJS server bundle.
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
