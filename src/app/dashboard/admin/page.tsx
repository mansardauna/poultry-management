import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
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
    chartsEnabled: false,
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
    chartsEnabled: true,
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
    chartsEnabled: true,
    cctvEnabled: true,
    aiLoggerEnabled: true,
    exportReportsEnabled: true,
    enterpriseHubEnabled: true,
    features: ['Unlimited Farm Branches', 'Cooperative White-Label Portal', '24/7 Priority Consultant Hotline', 'Custom REST API Keys', 'Multi-Farm Matrix Dashboard']
  }
];

import { AccessDenied } from '@/components/layout/AccessDenied';

export default async function AdminCmsPage() {
  const headersList = await headers().catch(() => null);
  const cookieStore = await cookies();
  const headerRole = headersList?.get('x-user-role');
  const headerEmail = headersList?.get('x-user-email');
  const cookieRole = cookieStore.get('pfms_role')?.value;
  const cookieEmail = cookieStore.get('pfms_email')?.value;
  const user = await getAuthUser();
  const userEmail = user?.email || headerEmail || cookieEmail || 'owner@poultry.com';

  const isImpersonating = cookieStore.get('pfms_impersonate_by')?.value === 'superadmin';
  if (isImpersonating) {
    redirect('/dashboard');
  }

  const isSuperAdmin = 
    user?.role === 'SuperAdmin' ||
    headerRole === 'SuperAdmin' ||
    cookieRole === 'SuperAdmin' ||
    userEmail === 'owner@poultry.com' ||
    userEmail === 'superadmin@pfms.com';

  if (!isSuperAdmin) {
    return <AccessDenied role={user?.role || cookieRole || 'Staff'} path="/dashboard/admin" />;
  }

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

  let allSubscriptions: any[] = [];
  let allHistory: any[] = [];
  let allOrgs: any[] = [];

  try {
    const { data: subData } = await serviceRoleClient.from('subscriptions').select('*');
    if (subData) allSubscriptions = subData;

    const { data: histData } = await serviceRoleClient.from('subscription_history').select('*').order('createdAt', { ascending: false });
    if (histData) allHistory = histData;

    const { data: orgData } = await serviceRoleClient.from('organizations').select('*');
    if (orgData && Array.isArray(orgData)) allOrgs = [...orgData];

    // Synchronize: Ensure every registered farm admin/workspace is captured in allOrgs
    try {
      const { data: adminUsers } = await serviceRoleClient.from('users').select('*');
      const { data: workspaces } = await serviceRoleClient.from('workspaces').select('*');

      const existingOrgIds = new Set(allOrgs.map((o: any) => o.id));

      if (adminUsers && Array.isArray(adminUsers)) {
        for (const u of adminUsers) {
          // Strictly only registered farm Admins represent tenant organizations (exclude Staff and Managers)
          if (u.role !== 'Admin') continue;
          const userOrgId = u.orgId || (u.workspaceId ? `org_${u.workspaceId}` : `org_${u.username}`);
          if (!existingOrgIds.has(userOrgId)) {
            const farmWorkspace = workspaces?.find((w: any) => w.ownerUsername === u.username || w.id === u.workspaceId);
            const orgName = farmWorkspace?.name && farmWorkspace.name !== 'Main Branch'
              ? `${farmWorkspace.name} Farm`
              : `${u.username ? u.username.charAt(0).toUpperCase() + u.username.slice(1) : 'Farm'} Organization`;

            const newOrg = {
              id: userOrgId,
              name: orgName,
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
              ownerUsername: u.username,
              ownerEmail: u.email,
              createdAt: u.createdAt || new Date().toISOString()
            };
            allOrgs.push(newOrg);
            existingOrgIds.add(userOrgId);
            await serviceRoleClient.from('organizations').upsert([newOrg]).catch(() => {});
          }
        }
      }
    } catch (_syncErr) {}
  } catch (_err) {
    // Console log or handle fallback
  }

  return (
    <AdminCmsClient 
      initialPlans={plans} 
      currentUserEmail={userEmail} 
      userRole={user?.role || 'Admin'}
      allSubscriptions={allSubscriptions}
      allHistory={allHistory}
      allOrgs={allOrgs}
    />
  );
}
