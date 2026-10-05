'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

import { getPublicBranding, DEFAULT_CMS } from '@/lib/branding';

export async function GET() {
  const data = await getPublicBranding();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const isSuperAdmin = 
      user.email === 'superadmin@pfms.com' || 
      user.email === 'owner@poultry.com' || 
      user.role === 'SuperAdmin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admin can edit landing CMS and brand settings.' }, { status: 403 });
    }

    const cmsData = await request.json();

    const effectiveBrandName = cmsData.brandName?.trim() || 'PFMS';
    const effectiveLogoUrl = cmsData.logoUrl || '/icon.png';

    const updatedCmsData = {
      ...cmsData,
      brandName: effectiveBrandName,
      platformName: effectiveBrandName,
      logoUrl: effectiveLogoUrl
    };

    const { error: upsertErr } = await serviceRoleClient.from('systemSettings').upsert([{
      id: 'landing_page_cms',
      workspaceId: 'global',
      adminName: JSON.stringify(updatedCmsData)
    }]);

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Synchronize currencySymbol & platformName & logoUrl to gateways_config
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
        platformName: effectiveBrandName,
        logoUrl: effectiveLogoUrl
      };

      await serviceRoleClient.from('systemSettings').upsert([{
        id: 'gateways_config',
        workspaceId: 'global',
        adminName: JSON.stringify(updatedGw)
      }]);
    } catch (_syncErr) {}

    // Synchronize public/manifest.json (PWA)
    try {
      const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestRaw);
        manifest.name = effectiveBrandName;
        manifest.short_name = effectiveBrandName;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      }
    } catch (_mErr) {}

    return NextResponse.json({ 
      success: true, 
      brandName: effectiveBrandName,
      logoUrl: effectiveLogoUrl,
      message: 'Platform Brand Identity & CMS content saved and propagated live!' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save landing page CMS content' }, { status: 500 });
  }
}
