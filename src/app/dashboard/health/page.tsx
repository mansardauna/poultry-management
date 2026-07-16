'use strict';
import { HealthClient } from "@/components/features/health/HealthClient";
import { cookies } from "next/headers";

/** Exported function default */
export default async function HealthPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  return <HealthClient role={role} />;
}
