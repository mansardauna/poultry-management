'use strict';
import { HousingClient } from "@/components/features/housing/HousingClient";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function HousingPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  return <HousingClient role={role} />;
}
