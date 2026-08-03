export function isDemoMode() {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function isVercelRuntime() {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
}

export function areLocalFileToolsUnavailable() {
  return isDemoMode() || isVercelRuntime();
}

export const LOCAL_FILE_TOOLS_UNAVAILABLE_MESSAGE =
  "Cette fonction utilise le disque local persistant et n'est disponible que dans l'installation locale/offline.";
