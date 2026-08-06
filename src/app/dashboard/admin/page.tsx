'use strict';

import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { AdminCmsClient, SaasPlanConfig } from '@/components/features/admin/AdminCmsClient';

const DEFAULT_PLANS: SaasPlanConfig[] = [
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
    features: ['1 Farm Branch Included', 'Basic Egg & Feed Logs', 'Community Forum Support', '2 Staff Accounts']
  },
  {
    id: 'pro',
    name: 'Commercial Pro',
    description: 'For growing poultry farms requiring AI telemetry and automated reports.',
    priceMonthly: 15000,
    priceAnnual: 144000,
    maxBranches: 5,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: false,
    features: ['Up to 5 Farm Branches', 'CCTV Live Surveillance', 'AI Voice Auto-Logger', 'PDF & Excel Export Reports', 'Unlimited Staff Accounts']
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Cooperative',
    description: 'For multi-farm operations, cooperative white-label portals, and API access.',
    priceMonthly: 45000,
    priceAnnual: 432000,
    maxBranches: 999,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: true,
    features: ['Unlimited Farm Branches', 'Cooperative White-Label Portal', '24/7 Priority Consultant Hotline', 'Custom REST API Keys', 'Multi-Farm Matrix Dashboard']
  }
];

export default async function AdminCmsPage() {
  const user = await getAuthUser();
  const userEmail = user?.email || '';

  let plans: SaasPlanConfig[] = DEFAULT_PLANS;
  try {
    const { data: configData } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'saas_plans_config')
      .single();

    if (configData?.adminName) {
      const parsed = JSON.parse(configData.adminName);
      if (Array.isArray(parsed) && parsed.length > 0) {
        plans = parsed as SaasPlanConfig[];
      }
    }
  } catch (_e) {
    // Fallback to default
  }

  return (
    <div className="p-6 md:p-8">
      <AdminCmsClient initialPlans={plans} currentUserEmail={userEmail} />
    </div>
  );
}
