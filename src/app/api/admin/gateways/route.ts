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
      stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: '',
      resendApiKey: '',
      fromEmail: 'support@pfms-poultry.com',
      platformName: 'PFMS',
      currencySymbol: '₦',
      aiProvider: 'gemini',
      aiApiKey: process.env.GEMINI_API_KEY || '',
      aiModel: 'gemini-3.5-flash',
      aiBaseUrl: '',
    };

    if (gatewayData?.adminName) {
      try {
        const parsed = typeof gatewayData.adminName === 'string'
          ? JSON.parse(gatewayData.adminName)
          : gatewayData.adminName;
        if (parsed && typeof parsed === 'object') {
          gateways = { ...gateways, ...parsed };
        }
      } catch (_e) {}
    }

    // Ensure fallback to env if empty
    if (!gateways.stripePublicKey) gateways.stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    if (!gateways.stripeSecretKey) gateways.stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
    if (!gateways.aiApiKey) gateways.aiApiKey = process.env.GEMINI_API_KEY || '';
    if (!gateways.aiModel || gateways.aiModel === 'gemini-2.0-flash' || gateways.aiModel === 'gemini-1.5-flash') {
      gateways.aiModel = 'gemini-3.5-flash';
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
      aiProvider = 'gemini',
      aiApiKey = '',
      aiModel = '',
      aiBaseUrl = '',
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
        existingConfig = typeof existingData.adminName === 'string'
          ? JSON.parse(existingData.adminName)
          : existingData.adminName;
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
      aiProvider: String(aiProvider).trim() || 'gemini',
      aiApiKey: String(aiApiKey).trim(),
      aiModel: String(aiModel).trim(),
      aiBaseUrl: String(aiBaseUrl).trim(),
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

    // Synchronize platformName and currencySymbol to landing_page_cms
    try {
      const { data: cmsRow } = await serviceRoleClient
        .from('systemSettings')
        .select('adminName')
        .eq('id', 'landing_page_cms')
        .maybeSingle();

      let cmsParsed: any = {};
      if (cmsRow?.adminName) {
        try {
          cmsParsed = typeof cmsRow.adminName === 'string' ? JSON.parse(cmsRow.adminName) : cmsRow.adminName;
        } catch (_e) {}
      }

      const updatedCms = {
        ...cmsParsed,
        currencySymbol: String(currencySymbol).trim(),
        brandName: String(platformName).trim(),
      };

      await serviceRoleClient.from('systemSettings').upsert([{
        id: 'landing_page_cms',
        workspaceId: 'global',
        adminName: JSON.stringify(updatedCms)
      }]);
    } catch (_syncErr) {}

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
