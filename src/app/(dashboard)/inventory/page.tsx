import { InventoryClient } from "@/components/features/inventory/InventoryClient";
import { cookies } from "next/headers";

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  return <InventoryClient role={role} />;
}
