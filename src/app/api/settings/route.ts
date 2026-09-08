'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

const REDACTED_VALUE = '********';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  
  const [alertSettingsRes, systemSettingsRes, paymentMethodsRes, subscriptionHistoryRes] = await Promise.all([
    supabase.from('alertSettings').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('systemSettings').select('*').eq('workspaceId', workspaceId).limit(1),
    supabase.from('payment_methods').select('*').eq('workspaceId', workspaceId),
    supabase.from('subscription_history').select('*').eq('workspaceId', workspaceId).order('createdAt', { ascending: false })
  ]);

  const systemRow = systemSettingsRes.data?.[0];
  const systemSettings = systemRow
    ? {
        ...systemRow,
        paystackSecretKey: systemRow.paystackSecretKey && !systemRow.paystackSecretKey.includes('placeholder') ? REDACTED_VALUE : (systemRow.paystackSecretKey || ''),
        stripeSecretKey: systemRow.stripeSecretKey && !systemRow.stripeSecretKey.includes('placeholder') ? REDACTED_VALUE : (systemRow.stripeSecretKey || ''),
        flutterwaveSecretKey: systemRow.flutterwaveSecretKey && !systemRow.flutterwaveSecretKey.includes('placeholder') ? REDACTED_VALUE : (systemRow.flutterwaveSecretKey || '')
      }
    : {};

  return NextResponse.json({
    alertSettings: alertSettingsRes.data?.[0] || {},
    systemSettings,
    paymentMethods: paymentMethodsRes.data || [],
    subscriptionHistory: subscriptionHistoryRes.data || []
  });
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'system') {
      const { data: existing } = await supabase
        .from('systemSettings')
        .select('*')
        .eq('workspaceId', workspaceId)
        .limit(1)
        .maybeSingle();

      // Merge updates over the existing row so subscription plan, enterprise features,
      // and previously stored gateway keys are not wiped by a partial update.
      const mergedSystemSettings: Record<string, unknown> = {
        id: existing?.id || body.id || 'sys-' + Date.now(),
        workspaceId,
        eggCratePriceSmall: existing?.eggCratePriceSmall ?? 4200,
        eggCratePriceLarge: existing?.eggCratePriceLarge ?? 4400,
        adminName: existing?.adminName || '',
        adminEmail: existing?.adminEmail || '',
        adminPhone: existing?.adminPhone || '',
        farmName: existing?.farmName || '',
        billingRegion: existing?.billingRegion || 'Nigeria & West Africa (NGN)',
        paystackPublicKey: existing?.paystackPublicKey || '',
        paystackSecretKey: existing?.paystackSecretKey || '',
        stripePublicKey: existing?.stripePublicKey || '',
        stripeSecretKey: existing?.stripeSecretKey || '',
        flutterwavePublicKey: existing?.flutterwavePublicKey || '',
        flutterwaveSecretKey: existing?.flutterwaveSecretKey || '',
        bankName: existing?.bankName || '',
        accountNumber: existing?.accountNumber || '',
        accountName: existing?.accountName || ''
      };

      const keepSecret = (next?: string, current?: string) => {
        if (!next || next === REDACTED_VALUE) return current || '';
        return next;
      };

      if (body.eggCratePriceSmall !== undefined) {
        mergedSystemSettings.eggCratePriceSmall = Number(body.eggCratePriceSmall) || existing?.eggCratePriceSmall || 4200;
      }
      if (body.eggCratePriceLarge !== undefined) {
        mergedSystemSettings.eggCratePriceLarge = Number(body.eggCratePriceLarge) || existing?.eggCratePriceLarge || 4400;
      }
      if (body.adminName !== undefined) mergedSystemSettings.adminName = body.adminName;
      if (body.adminEmail !== undefined) mergedSystemSettings.adminEmail = body.adminEmail;
      if (body.adminPhone !== undefined) mergedSystemSettings.adminPhone = body.adminPhone;
      if (body.farmName !== undefined) mergedSystemSettings.farmName = body.farmName;
      if (body.billingRegion !== undefined) mergedSystemSettings.billingRegion = body.billingRegion;
      if (body.paystackPublicKey !== undefined) mergedSystemSettings.paystackPublicKey = body.paystackPublicKey;
      if (body.stripePublicKey !== undefined) mergedSystemSettings.stripePublicKey = body.stripePublicKey;
      if (body.flutterwavePublicKey !== undefined) mergedSystemSettings.flutterwavePublicKey = body.flutterwavePublicKey;
      if (body.bankName !== undefined) mergedSystemSettings.bankName = body.bankName;
      if (body.accountNumber !== undefined) mergedSystemSettings.accountNumber = body.accountNumber;
      if (body.accountName !== undefined) mergedSystemSettings.accountName = body.accountName;
      mergedSystemSettings.paystackSecretKey = keepSecret(body.paystackSecretKey, existing?.paystackSecretKey);
      mergedSystemSettings.stripeSecretKey = keepSecret(body.stripeSecretKey, existing?.stripeSecretKey);
      mergedSystemSettings.flutterwaveSecretKey = keepSecret(body.flutterwaveSecretKey, existing?.flutterwaveSecretKey);

      const { error: upsertErr } = await supabase
        .from('systemSettings')
        .upsert([mergedSystemSettings], { onConflict: 'workspaceId' });

      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, systemSettings: mergedSystemSettings });
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

    // Default: Alert Settings (merge so untouched flags are preserved)
    const { data: existingAlert } = await supabase
      .from('alertSettings')
      .select('*')
      .eq('workspaceId', workspaceId)
      .limit(1)
      .maybeSingle();

    const currentAlert = existingAlert || {};
    const newSettings = {
      workspaceId,
      feedThresholdKg: body.feedThresholdKg !== undefined ? Number(body.feedThresholdKg) || currentAlert.feedThresholdKg || 50 : currentAlert.feedThresholdKg,
      eggDropPercentage: body.eggDropPercentage !== undefined ? Number(body.eggDropPercentage) || currentAlert.eggDropPercentage || 15 : currentAlert.eggDropPercentage,
      notifySms: body.notifySms !== undefined ? !!body.notifySms : !!currentAlert.notifySms,
      notifyEmail: body.notifyEmail !== undefined ? !!body.notifyEmail : !!currentAlert.notifyEmail,
      notifyWhatsapp: body.notifyWhatsapp !== undefined ? !!body.notifyWhatsapp : !!currentAlert.notifyWhatsapp
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
