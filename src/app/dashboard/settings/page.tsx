'use strict';
import { db } from "@/lib/drizzle";
import * as schema from "@/lib/schema";
import { SettingsClient } from "@/components/features/settings/SettingsClient";
import { getWorkspaceId } from "@/lib/workspace";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/** Exported function default */
export default async function SettingsPage() {
  const workspaceId = await getWorkspaceId();
  
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  const alertSettings = (await db.select().from(schema.alertSettings).where(eq(schema.alertSettings.workspaceId, workspaceId)).limit(1))[0] ?? {
    feedThresholdKg: 50,
    eggDropPercentage: 15,
    notifySms: true,
    notifyEmail: true,
    notifyWhatsapp: true,
  };

  const rawSystemSettings = (await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.workspaceId, workspaceId)).limit(1))[0];
  const systemSettings = rawSystemSettings ? {
    ...rawSystemSettings,
    eggCratePriceSmall: rawSystemSettings.eggCratePriceSmall ?? undefined,
    eggCratePriceLarge: rawSystemSettings.eggCratePriceLarge ?? undefined,
    adminName: rawSystemSettings.adminName ?? undefined,
    adminEmail: rawSystemSettings.adminEmail ?? undefined,
    adminPhone: rawSystemSettings.adminPhone ?? undefined,
  } : {
    id: 'default',
    workspaceId,
    eggCratePriceSmall: 4200,
    eggCratePriceLarge: 4400,
    adminName: 'Farm Admin',
    adminEmail: 'admin@example.com',
    adminPhone: '+2340000000000'
  };

  const workspaces = await db.select().from(schema.workspaces);
  
  const allStaff = await db.select().from(schema.staff);

  return <SettingsClient 
    initialSettings={alertSettings} 
    systemSettings={systemSettings} 
    workspaces={workspaces} 
    workspaceId={workspaceId} 
  />;
}
