'use strict';
import { HealthClient } from "@/components/features/health/HealthClient";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function HealthPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  return <HealthClient role={role} />;
}
