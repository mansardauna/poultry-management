'use strict';
import { InventoryClient } from "@/components/features/inventory/InventoryClient";
import { getAuthUser } from '@/lib/auth';

/** Exported function default */
export default async function InventoryPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  return <InventoryClient role={role} />;
}
