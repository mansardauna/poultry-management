'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';

import { getPublicPlans } from '@/lib/plans';

export async function GET() {
  const plans = await getPublicPlans();
  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.role === 'SuperAdmin';

    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can update plan configurations' }, { status: 403 });
    }

    const { plans } = await request.json();
    if (!Array.isArray(plans)) {
      return NextResponse.json({ error: 'Invalid plans array' }, { status: 400 });
    }

    await serviceRoleClient.from('systemSettings').upsert([{
      id: 'saas_plans_config',
      workspaceId: 'global',
      adminName: JSON.stringify(plans)
    }]);

    // Live sync features to all existing subscribers based on tier
    for (const p of plans) {
      await serviceRoleClient
        .from('systemSettings')
        .update({
          cctvEnabled: !!p.cctvEnabled,
          aiLoggerEnabled: !!p.aiLoggerEnabled,
          exportReportsEnabled: !!p.exportReportsEnabled,
          enterpriseHubEnabled: !!p.enterpriseHubEnabled,
          chartsEnabled: !!p.chartsEnabled
        })
        .eq('subscriptionTier', p.id);
    }

    return NextResponse.json({ success: true, message: 'SaaS plan configurations & live subscriber feature entitlements updated successfully!' });
  } catch (err) {
    return NextResponse.json({ error: (err as { message?: string })?.message || 'Failed to update plans' }, { status: 500 });
  }
}
