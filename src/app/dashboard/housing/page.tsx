'use strict';
import { HousingClient } from "@/components/features/housing/HousingClient";
import { getAuthUser } from '@/lib/auth';
import { isRouteAllowedForRole } from '@/lib/permissions';
import { AccessDenied } from '@/components/layout/AccessDenied';

/** Exported function default */
export default async function HousingPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  if (!isRouteAllowedForRole('/dashboard/housing', role)) {
    return <AccessDenied role={role} path="/dashboard/housing" />;
  }

  return <HousingClient role={role} />;
}
