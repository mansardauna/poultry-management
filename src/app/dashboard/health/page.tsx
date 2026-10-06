'use strict';
import { HealthClient } from "@/components/features/health/HealthClient";
import { getAuthUser } from '@/lib/auth';

/** Exported function default */
export default async function HealthPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  return <HealthClient role={role} />;
}
