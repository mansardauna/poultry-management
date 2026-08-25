'use strict';

import { NextResponse } from 'next/server';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

/**
 * GET Handler: Check system setup status and existing gateway configurations
 */
export async function GET() {
  try {
    // 1. Verify database connection
    const { data: dbCheck, error: dbError } = await serviceRoleClient
      .from('systemSettings')
      .select('id')
      .limit(1);

    const isDatabaseConnected = !dbError;

    // 2. Fetch existing Gateway Configurations
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
      fromEmail: 'noreply@pfms-poultry.com',
      platformName: 'Poultry Farm Management System',
      currencySymbol: '₦',
      proPriceMonthly: 15000,
      proPriceAnnual: 144000,
      enterprisePriceMonthly: 45000,
      enterprisePriceAnnual: 432000,
      isSetupCompleted: false,
    };

    if (gatewayData?.adminName) {
      try {
        const parsed = JSON.parse(gatewayData.adminName);
        gateways = { ...gateways, ...parsed };
      } catch (_e) {}
    }

    // 3. Check Super Admin exists
    const { data: superAdmin } = await serviceRoleClient
      .from('users')
      .select('id, username, email, role')
      .or('role.eq.SuperAdmin,username.eq.superadmin@pfms.com,email.eq.owner@poultry.com')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      isDatabaseConnected,
      isSetupCompleted: gateways.isSetupCompleted || Boolean(superAdmin),
      superAdminExists: Boolean(superAdmin),
      superAdminEmail: superAdmin?.email || superAdmin?.username || 'owner@poultry.com',
      gateways,
    });
  } catch (err: any) {
    return NextResponse.json({
      isDatabaseConnected: false,
      isSetupCompleted: false,
      error: err?.message || 'Failed to check system setup status',
    }, { status: 500 });
  }
}

/**
 * POST Handler: Process System Setup & Initial Deployment Configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      superAdminEmail,
      superAdminPassword,
      platformName = 'Poultry Farm Management System',
      currencySymbol = '₦',
      paystackPublicKey = '',
      paystackSecretKey = '',
      stripePublicKey = '',
      stripeSecretKey = '',
      stripeWebhookSecret = '',
      resendApiKey = '',
      fromEmail = 'noreply@pfms-poultry.com',
      proPriceMonthly = 15000,
      proPriceAnnual = 144000,
      enterprisePriceMonthly = 45000,
      enterprisePriceAnnual = 432000,
    } = body;

    if (!superAdminEmail || !superAdminPassword) {
      return NextResponse.json(
        { error: 'Super Admin Email and Password are required to complete installation.' },
        { status: 400 }
      );
    }

    if (superAdminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Super Admin Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // 1. Provision / Update Super Admin in Supabase Auth
    let userId = '';
    const cleanEmail = superAdminEmail.trim().toLowerCase();

    try {
      const { data: usersData } = await serviceRoleClient.auth.admin.listUsers();
      const existingUser = usersData?.users.find(u => u.email?.toLowerCase() === cleanEmail);

      if (existingUser) {
        userId = existingUser.id;
        await serviceRoleClient.auth.admin.updateUserById(userId, {
          password: superAdminPassword,
          email_confirm: true,
          user_metadata: { role: 'SuperAdmin' }
        });
      } else {
        const { data: createdAuth, error: createAuthErr } = await serviceRoleClient.auth.admin.createUser({
          email: cleanEmail,
          password: superAdminPassword,
          email_confirm: true,
          user_metadata: { role: 'SuperAdmin' }
        });

        if (createAuthErr) {
          return NextResponse.json({ error: `Auth creation failed: ${createAuthErr.message}` }, { status: 400 });
        }
        userId = createdAuth.user.id;
      }
    } catch (authErr: any) {
      console.error('Setup Auth Provisioning Error:', authErr);
    }

    // 2. Ensure Super Admin Organization & Workspace Exist
    const orgId = 'org_owner_main';
    const workspaceId = 'main-org_owner_main';

    await serviceRoleClient.from('organizations').upsert([{
      id: orgId,
      name: `${platformName} Master Org`,
      ownerId: userId || 'superadmin-owner-id',
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active'
    }]);

    if (userId) {
      await serviceRoleClient.from('organization_members').upsert([{
        orgId,
        userId,
        role: 'SuperAdmin'
      }]);
    }

    await serviceRoleClient.from('workspaces').upsert([{
      id: workspaceId,
      name: 'Main Branch',
      type: 'Layer Farm',
      createdAt: new Date().toISOString(),
      ownerUsername: cleanEmail.split('@')[0]
    }]);

    // 3. Save Gateways & System Configurations to systemSettings Table
    const gatewayConfig = {
      paystackPublicKey: paystackPublicKey.trim(),
      paystackSecretKey: paystackSecretKey.trim(),
      stripePublicKey: stripePublicKey.trim(),
      stripeSecretKey: stripeSecretKey.trim(),
      stripeWebhookSecret: stripeWebhookSecret.trim(),
      resendApiKey: resendApiKey.trim(),
      fromEmail: fromEmail.trim(),
      platformName: platformName.trim(),
      currencySymbol: currencySymbol.trim(),
      proPriceMonthly: Number(proPriceMonthly),
      proPriceAnnual: Number(proPriceAnnual),
      enterprisePriceMonthly: Number(enterprisePriceMonthly),
      enterprisePriceAnnual: Number(enterprisePriceAnnual),
      isSetupCompleted: true,
      updatedAt: new Date().toISOString(),
    };

    const { error: saveGatewaysErr } = await serviceRoleClient
      .from('systemSettings')
      .upsert([{
        id: 'gateways_config',
        workspaceId: 'global',
        adminName: JSON.stringify(gatewayConfig)
      }]);

    if (saveGatewaysErr) {
      return NextResponse.json({ error: `Failed to save gateway config: ${saveGatewaysErr.message}` }, { status: 500 });
    }

    // 4. Update SaaS Pricing Configuration
    const updatedPlans = [
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
        priceMonthly: Number(proPriceMonthly),
        priceAnnual: Number(proPriceAnnual),
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
        priceMonthly: Number(enterprisePriceMonthly),
        priceAnnual: Number(enterprisePriceAnnual),
        maxBranches: 999,
        cctvEnabled: true,
        aiLoggerEnabled: true,
        exportReportsEnabled: true,
        enterpriseHubEnabled: true,
        features: ['Unlimited Farm Branches', 'Cooperative White-Label Portal', '24/7 Priority Consultant Hotline', 'Custom REST API Keys', 'Multi-Farm Matrix Dashboard']
      }
    ];

    await serviceRoleClient.from('systemSettings').upsert([{
      id: 'saas_plans_config',
      workspaceId: 'global',
      adminName: JSON.stringify(updatedPlans)
    }]);

    const response = NextResponse.json({
      success: true,
      message: 'Platform Installation & Setup Completed Successfully!',
      superAdminEmail: cleanEmail,
      loginUrl: '/login',
      dashboardUrl: '/dashboard/admin',
    });

    // Set installation cookie
    response.cookies.set('pfms_installation_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });

    return response;
  } catch (err: any) {
    console.error('Setup API Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error during setup' }, { status: 500 });
  }
}
