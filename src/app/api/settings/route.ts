'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  
  const [alertSettingsRes, systemSettingsRes, paymentMethodsRes, subscriptionHistoryRes] = await Promise.all([
    supabase.from('alertSettings').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('systemSettings').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('payment_methods').select('*').eq('workspaceId', workspaceId),
    supabase.from('subscription_history').select('*').eq('workspaceId', workspaceId).order('createdAt', { ascending: false })
  ]);

  return NextResponse.json({
    alertSettings: alertSettingsRes.data?.[0] || {},
    systemSettings: systemSettingsRes.data?.[0] || {},
    paymentMethods: paymentMethodsRes.data || [],
    subscriptionHistory: subscriptionHistoryRes.data || []
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
        ...(body.paystackSecretKey ? { paystackSecretKey: body.paystackSecretKey } : {}),
        ...(body.stripePublicKey ? { stripePublicKey: body.stripePublicKey } : {}),
        ...(body.stripeSecretKey ? { stripeSecretKey: body.stripeSecretKey } : {}),
        ...(body.flutterwavePublicKey ? { flutterwavePublicKey: body.flutterwavePublicKey } : {}),
        ...(body.flutterwaveSecretKey ? { flutterwaveSecretKey: body.flutterwaveSecretKey } : {}),
        ...(body.bankName ? { bankName: body.bankName } : {}),
        ...(body.accountNumber ? { accountNumber: body.accountNumber } : {}),
        ...(body.accountName ? { accountName: body.accountName } : {})
      };

      await supabase.from('systemSettings').delete().eq('workspaceId', workspaceId);
      await supabase.from('systemSettings').insert([newSystemSettings]);

      return NextResponse.json({ success: true, systemSettings: newSystemSettings });
    }

    if (body.action === 'addPaymentMethod') {
      const newMethod = {
        id: 'pm_' + Date.now(),
        workspaceId,
        brand: body.brand || 'Visa',
        last4: body.last4 || '4242',
        expMonth: Number(body.expMonth) || 12,
        expYear: Number(body.expYear) || 2028,
        isDefault: !!body.isDefault,
        createdAt: new Date().toISOString()
      };

      if (body.isDefault) {
        await supabase.from('payment_methods').update({ isDefault: false }).eq('workspaceId', workspaceId);
      }

      const { data, error } = await supabase.from('payment_methods').insert([newMethod]).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, paymentMethod: data?.[0] || newMethod });
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const workspaceId = await getWorkspaceId();

    if (type === 'paymentMethod' && id) {
      await supabase.from('payment_methods').delete().eq('id', id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
