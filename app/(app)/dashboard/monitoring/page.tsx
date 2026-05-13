import React from 'react';
import { Activity, Server, Database, HardDrive, Shield } from 'lucide-react';
import { requireAnyRole } from '@/lib/authz';
import { redirect } from 'next/navigation';
import { MonitoringClient } from '@/components/monitoring/MonitoringClient';

export default async function MonitoringDashboard() {
  const auth = await requireAnyRole(['ADMIN']);
  if (!auth.ok) redirect('/dashboard');

  return <MonitoringClient />;
}
