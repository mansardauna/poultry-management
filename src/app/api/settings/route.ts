import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  const workspaceId = await getWorkspaceId();
  
  const [alertSettings] = await db.select().from(schema.alertSettings).where(eq(schema.alertSettings.workspaceId, workspaceId)).limit(1);
  const [systemSettings] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.workspaceId, workspaceId)).limit(1);

  return NextResponse.json({
    alertSettings: alertSettings || {},
    systemSettings: systemSettings || {}
  });
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'system') {
      const newSystemSettings = {
        id: body.id || 'sys-' + Date.now(),
        workspaceId,
        eggCratePriceSmall: Number(body.eggCratePriceSmall) || 4200,
        eggCratePriceLarge: Number(body.eggCratePriceLarge) || 4400,
        adminName: body.adminName || 'Farm Admin',
        adminEmail: body.adminEmail || 'admin@example.com',
        adminPhone: body.adminPhone || '+2340000000000'
      };

      await db.transaction(async (tx) => {
        await tx.delete(schema.systemSettings).where(eq(schema.systemSettings.workspaceId, workspaceId));
        await tx.insert(schema.systemSettings).values(newSystemSettings);
      });

      return NextResponse.json({ success: true, systemSettings: newSystemSettings });
    }

    // Default: Alert Settings
    const newSettings = {
      workspaceId,
      feedThresholdKg: Number(body.feedThresholdKg) || 50,
      eggDropPercentage: Number(body.eggDropPercentage) || 15,
      notifySms: !!body.notifySms,
      notifyEmail: !!body.notifyEmail,
      notifyWhatsapp: !!body.notifyWhatsapp
    };

    await db.transaction(async (tx) => {
      await tx.delete(schema.alertSettings).where(eq(schema.alertSettings.workspaceId, workspaceId));
      await tx.insert(schema.alertSettings).values(newSettings);
      
      await tx.insert(schema.alertLogs).values({
        id: 'al' + Date.now().toString().slice(-8),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `SETTINGS UPDATED: Feed critical alert set to ${newSettings.feedThresholdKg}kg.`,
        severity: 'Info',
        read: false
      });
    });

    return NextResponse.json({ success: true, alertSettings: newSettings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
