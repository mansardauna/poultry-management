'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';

const DEFAULT_CMS = {
  brandName: 'PFMS',
  brandTagline: 'Smart Poultry Operating System',
  brandLogoText: 'P',
  logoUrl: '',
  primaryColor: '#4f46e5',
  accentColor: '#7c3aed',
  footerText: 'PFMS Inc. All rights reserved.',
  heroHeading: 'AI-Driven poultry farms with human-level precision',
  heroSubtitle: 'Empower your farm managers with AI-driven insights to help them track flock health, predict egg yields, and perform at peak efficiency.',
  announcementBanner: 'New Release: AI Voice Auto-Logger & Multi-Farm Enterprise Hub live now',
  ctaText: 'Get Started Free',
  supportPhone: '+234 800 768 5879',
  supportEmail: 'support@pfms-poultry.com',
  currencySymbol: '₦'
};

export async function GET() {
  try {
    const { data: cmsRow } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'landing_page_cms')
      .maybeSingle();

    const { data: gatewayRow } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'gateways_config')
      .maybeSingle();

    let cmsParsed: any = {};
    if (cmsRow?.adminName) {
      try {
        cmsParsed = typeof cmsRow.adminName === 'string' ? JSON.parse(cmsRow.adminName) : cmsRow.adminName;
      } catch (_e) {}
    }

    let gatewayParsed: any = {};
    if (gatewayRow?.adminName) {
      try {
        gatewayParsed = typeof gatewayRow.adminName === 'string' ? JSON.parse(gatewayRow.adminName) : gatewayRow.adminName;
      } catch (_e) {}
    }

    const merged = {
      ...DEFAULT_CMS,
      ...gatewayParsed,
      ...cmsParsed,
      currencySymbol: cmsParsed.currencySymbol || gatewayParsed.currencySymbol || DEFAULT_CMS.currencySymbol || '₦',
      brandName: cmsParsed.brandName || gatewayParsed.platformName || DEFAULT_CMS.brandName,
      platformName: cmsParsed.brandName || gatewayParsed.platformName || DEFAULT_CMS.brandName,
    };

    return NextResponse.json(merged);
  } catch (_err: any) {
    return NextResponse.json(DEFAULT_CMS);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.email === 'owner@poultry.com' || user?.role === 'SuperAdmin';

    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can edit landing CMS and brand settings' }, { status: 403 });
    }

    const cmsData = await request.json();

    const { error: upsertErr } = await serviceRoleClient.from('systemSettings').upsert([{
      id: 'landing_page_cms',
      workspaceId: 'global',
      adminName: JSON.stringify(cmsData)
    }]);

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Synchronize currencySymbol & platformName to gateways_config for platform-wide consistency
    try {
      const { data: gwRow } = await serviceRoleClient
        .from('systemSettings')
        .select('adminName')
        .eq('id', 'gateways_config')
        .maybeSingle();

      let gwParsed: any = {};
      if (gwRow?.adminName) {
        try {
          gwParsed = typeof gwRow.adminName === 'string' ? JSON.parse(gwRow.adminName) : gwRow.adminName;
        } catch (_e) {}
      }

      const updatedGw = {
        ...gwParsed,
        ...(cmsData.currencySymbol ? { currencySymbol: cmsData.currencySymbol } : {}),
        ...(cmsData.brandName ? { platformName: cmsData.brandName } : {})
      };

      await serviceRoleClient.from('systemSettings').upsert([{
        id: 'gateways_config',
        workspaceId: 'global',
        adminName: JSON.stringify(updatedGw)
      }]);
    } catch (_syncErr) {}

    return NextResponse.json({ success: true, message: 'Platform Brand Identity & CMS content saved and propagated live!' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save landing page CMS content' }, { status: 500 });
  }
}
