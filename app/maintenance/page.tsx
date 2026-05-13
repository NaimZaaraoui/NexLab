import { getSettings } from '@/lib/settings';
import { auth } from '@/lib/auth';
import { MaintenanceScreen } from '@/components/system/MaintenanceScreen';

export default async function MaintenancePage() {
  const [settings, session] = await Promise.all([
    getSettings(['maintenance_mode', 'maintenance_message']),
    auth(),
  ]);

  return (
    <MaintenanceScreen
      message={settings.maintenance_message}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  );
}
