import ClientLayout from "@/components/layout/ClientLayout";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { MaintenanceScreen } from "@/components/system/MaintenanceScreen";
import { LicenseProvider } from "@/components/providers/LicenseProvider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, settings] = await Promise.all([
    auth(),
    getSettings(['maintenance_mode', 'maintenance_message']),
  ]);

  if (settings.maintenance_mode === 'true' && session?.user?.role !== 'ADMIN') {
    return <MaintenanceScreen message={settings.maintenance_message} />;
  }

  return (
    <LicenseProvider>
      <ClientLayout>
        {children}
      </ClientLayout>
    </LicenseProvider>
  );
}
