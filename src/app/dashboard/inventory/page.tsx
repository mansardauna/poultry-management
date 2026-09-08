'use strict';
import { InventoryClient } from "@/components/features/inventory/InventoryClient";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function InventoryPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  return <InventoryClient role={role} />;
}
