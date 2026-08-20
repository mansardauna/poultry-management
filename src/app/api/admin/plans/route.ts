'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    description: 'Perfect for small farms getting started with digital log management.',
    priceMonthly: 0,
    priceAnnual: 0,
    maxBranches: 1,
    cctvEnabled: false,
    aiLoggerEnabled: false,
    exportReportsEnabled: false,
    enterpriseHubEnabled: false,
    features: [
      '1 Farm Branch Included',
      'Basic Egg Collection & Feed Tracking',
      'Basic Flock Mortality & Weight Logs',
      '2 Staff Accounts',
      'Basic KPI Metrics Summary',
      'Community Forum & Documentation Support'
    ]
  },
  {
    id: 'pro',
    name: 'Commercial Pro',
    description: 'For growing poultry farms requiring AI telemetry, advanced charts, and automated reports.',
    priceMonthly: 15000,
    priceAnnual: 144000,
    maxBranches: 5,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: false,
    features: [
      'Up to 5 Regional Farm Branches',
      'Production Analytics Bar & Line Charts',
      'Voice & Text AI Auto-Logger Widget',
      'CCTV Live Surveillance Gateway',
      'PDF & Excel Exportable Financial Reports',
      'Shift Checklist Queue & Payroll Indicators',
      'Unlimited Staff Accounts'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Cooperative',
    description: 'For multi-farm operations, cooperative white-label portals, REST APIs, and vet hotlines.',
    priceMonthly: 45000,
    priceAnnual: 432000,
    maxBranches: 999,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: true,
    features: [
      'Unlimited Regional Farm Branches',
      'Multi-Farm Branch Matrix & Aggregated Telemetry',
      'Cross-Branch Inter-Location Stock Transfers',
      'Permanent Branch Deletion & Matrix Control',
      'Global White-Labeling & Themes (Logo, Subdomain, Invoices & PDF)',
      'Production REST API Keys & Webhooks (QuickBooks, SAP, Sage)',
      '24/7 Priority Veterinarian Inspection Ticket Hotline',
      'Wholesale Feed Procurement Pool (15% Bulk Volume Discounts)'
    ]
  }
];

export async function GET() {
  try {
    const { data } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'saas_plans_config')
      .single();

    if (data?.adminName) {
      const parsedPlans = JSON.parse(data.adminName);
      if (Array.isArray(parsedPlans) && parsedPlans.length > 0) {
        return NextResponse.json(parsedPlans);
      }
    }
    return NextResponse.json(DEFAULT_PLANS);
  } catch (err: any) {
    return NextResponse.json(DEFAULT_PLANS);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.role === 'SuperAdmin';

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
          enterpriseHubEnabled: !!p.enterpriseHubEnabled
        })
        .eq('subscriptionTier', p.id);
    }

    return NextResponse.json({ success: true, message: 'SaaS plan configurations & live subscriber feature entitlements updated successfully!' });
  } catch (err: any) {
    console.error('Super Admin CMS Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update plans' }, { status: 500 });
  }
}
