'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  
  const [alertSettingsRes, systemSettingsRes] = await Promise.all([
    supabase.from('alertSettings').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('systemSettings').select('*').eq('workspaceId', workspaceId).limit(1)
  ]);

  return NextResponse.json({
    alertSettings: alertSettingsRes.data?.[0] || {},
    systemSettings: systemSettingsRes.data?.[0] || {}
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
        adminPhone: body.adminPhone || '+2340000000000',
        ...(body.paystackPublicKey ? { paystackPublicKey: body.paystackPublicKey } : {}),
        ...(body.paystackSecretKey ? { paystackSecretKey: body.paystackSecretKey } : {})
      };

      await supabase.from('systemSettings').delete().eq('workspaceId', workspaceId);
      await supabase.from('systemSettings').insert([newSystemSettings]);

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

    await supabase.from('alertSettings').delete().eq('workspaceId', workspaceId);
    await supabase.from('alertSettings').insert([newSettings]);
    
    await supabase.from('alertLogs').insert([{
      id: 'al' + Date.now().toString().slice(-8),
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      message: `SETTINGS UPDATED: Feed critical alert set to ${newSettings.feedThresholdKg}kg.`,
      severity: 'Info',
      read: false
    }]);

    return NextResponse.json({ success: true, alertSettings: newSettings });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
