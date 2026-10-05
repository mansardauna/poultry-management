'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';
import { getAuthUser } from '@/lib/auth';

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
    const user = await getAuthUser();
    if (user?.role === 'Staff') {
      return NextResponse.json({ error: 'Permission denied: Staff cannot modify system settings or alert configurations.' }, { status: 403 });
    }

    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'system') {
      const newSystemSettings = {
        id: body.id || 'sys-' + Date.now(),
        workspaceId,
        eggCratePriceSmall: Number(body.eggCratePriceSmall) || 4200,
        eggCratePriceLarge: Number(body.eggCratePriceLarge) || 4400,
        adminName: body.adminName || '',
        adminEmail: body.adminEmail || '',
        adminPhone: body.adminPhone || '',
        farmName: body.farmName || '',
        billingRegion: body.billingRegion || 'Nigeria & West Africa (NGN)',
        currencySymbol: body.currencySymbol || '$',
        exchangeRate: Number(body.exchangeRate) > 0 ? Number(body.exchangeRate) : 1.0,
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

      if (body.farmName && typeof body.farmName === 'string') {
        const trimmedName = body.farmName.trim();
        if (trimmedName) {
          // Update current workspace name in workspaces table
          await supabase.from('workspaces').update({ name: trimmedName }).eq('id', workspaceId);
          // Also update organization name if this workspace matches an organization
          let orgId = '';
          const match = workspaceId.match(/org_[a-zA-Z0-9]+/);
          if (match) orgId = match[0];
          if (orgId) {
            await supabase.from('organizations').update({ name: trimmedName }).eq('id', orgId);
          }
        }
      }

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
      minDailyEggCount: Number(body.minDailyEggCount) || 0,
      tempMin: body.tempMin !== undefined && body.tempMin !== '' ? Number(body.tempMin) : 18.0,
      tempMax: body.tempMax !== undefined && body.tempMax !== '' ? Number(body.tempMax) : 28.0,
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
    const user = await getAuthUser();
    if (user?.role === 'Staff') {
      return NextResponse.json({ error: 'Permission denied: Staff cannot modify or delete payment methods and settings.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let type = searchParams.get('type');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
      type = body.type || type;
    }

    if (type === 'paymentMethod' && id) {
      const { error } = await supabase.from('payment_methods').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete: ' + (err?.message || String(err)) }, { status: 500 });
  }
}
