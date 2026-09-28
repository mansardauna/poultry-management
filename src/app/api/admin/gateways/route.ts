'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.email === 'owner@poultry.com' || user?.role === 'SuperAdmin';

    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Access restricted to Super Admin.' }, { status: 403 });
    }

    const { data: gatewayData } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'gateways_config')
      .maybeSingle();

    let gateways = {
      paystackPublicKey: '',
      paystackSecretKey: '',
      stripePublicKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
      resendApiKey: '',
      fromEmail: 'support@pfms-poultry.com',
      platformName: 'PFMS',
      currencySymbol: '₦',
    };

    if (gatewayData?.adminName) {
      try {
        const parsed = JSON.parse(gatewayData.adminName);
        gateways = { ...gateways, ...parsed };
      } catch (_e) {}
    }

    return NextResponse.json({
      success: true,
      gateways,
      superAdminEmail: user.email || 'owner@poultry.com'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch gateway configuration' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.email === 'owner@poultry.com' || user?.role === 'SuperAdmin';

    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Access restricted to Super Admin.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      platformName = 'PFMS',
      currencySymbol = '₦',
      superAdminEmail,
      superAdminPassword,
      paystackPublicKey = '',
      paystackSecretKey = '',
      stripePublicKey = '',
      stripeSecretKey = '',
      stripeWebhookSecret = '',
      resendApiKey = '',
      fromEmail = 'support@pfms-poultry.com',
    } = body;

    // Fetch existing gateway config to merge
    const { data: existingData } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'gateways_config')
      .maybeSingle();

    let existingConfig = {};
    if (existingData?.adminName) {
      try {
        existingConfig = JSON.parse(existingData.adminName);
      } catch (_e) {}
    }

    const updatedConfig = {
      ...existingConfig,
      platformName: String(platformName).trim(),
      currencySymbol: String(currencySymbol).trim(),
      paystackPublicKey: String(paystackPublicKey).trim(),
      paystackSecretKey: String(paystackSecretKey).trim(),
      stripePublicKey: String(stripePublicKey).trim(),
      stripeSecretKey: String(stripeSecretKey).trim(),
      stripeWebhookSecret: String(stripeWebhookSecret).trim(),
      resendApiKey: String(resendApiKey).trim(),
      fromEmail: String(fromEmail).trim(),
      updatedAt: new Date().toISOString(),
    };

    const { error: saveErr } = await serviceRoleClient
      .from('systemSettings')
      .upsert([{
        id: 'gateways_config',
        workspaceId: 'global',
        adminName: JSON.stringify(updatedConfig)
      }]);

    if (saveErr) {
      return NextResponse.json({ error: `Failed to save gateways: ${saveErr.message}` }, { status: 500 });
    }

    // If password update requested for SuperAdmin
    if (superAdminPassword && typeof superAdminPassword === 'string' && superAdminPassword.trim().length >= 6) {
      const passwordHash = await bcrypt.hash(superAdminPassword.trim(), 10);
      await serviceRoleClient
        .from('users')
        .update({ passwordHash, updatedAt: new Date().toISOString() })
        .eq('id', user.id);
    }

    // If email update requested
    if (superAdminEmail && superAdminEmail.trim() && superAdminEmail.trim() !== user.email) {
      await serviceRoleClient
        .from('users')
        .update({ email: superAdminEmail.trim(), updatedAt: new Date().toISOString() })
        .eq('id', user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment gateways, platform settings, and credentials updated successfully!'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update gateways' }, { status: 500 });
  }
}
