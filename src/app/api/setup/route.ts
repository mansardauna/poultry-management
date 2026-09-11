'use strict';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as envServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

/**
 * GET Handler: Check system setup status, database connectivity, and gateway configurations
 */
export async function GET() {
  try {
    // 1. Verify database connection
    const { data: dbCheck, error: dbError } = await envServiceRoleClient
      .from('systemSettings')
      .select('id')
      .limit(1);

    const isDatabaseConnected = !dbError;

    // 2. Fetch existing Gateway Configurations
    const { data: gatewayData } = await envServiceRoleClient
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

    // 3. Fetch Database Driver Configuration
    const { data: dbDriverData } = await envServiceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'database_config')
      .maybeSingle();

    let databaseConfig = {
      databaseType: 'supabase',
      postgresHost: '',
      postgresPort: 5432,
      postgresDb: '',
      postgresUser: '',
      mysqlHost: '',
      mysqlPort: 3306,
      mysqlDatabase: '',
      mysqlUser: '',
    };

    if (dbDriverData?.adminName) {
      try {
        const parsed = JSON.parse(dbDriverData.adminName);
        databaseConfig = { ...databaseConfig, ...parsed };
      } catch (_e) {}
    }

    // 4. Check Super Admin exists
    const { data: superAdmin } = await envServiceRoleClient
      .from('users')
      .select('id, username, email, role')
      .or('role.eq.SuperAdmin,username.eq.superadmin@pfms.com,email.eq.owner@poultry.com')
      .limit(1)
      .maybeSingle();

    // Never return secret gateway keys to the browser — only indicate whether they are configured.
    if (gateways.isSetupCompleted) {
      gateways = {
        ...gateways,
        paystackSecretKey: '',
        stripeSecretKey: '',
        stripeWebhookSecret: '',
        resendApiKey: '',
      };
    }

    return NextResponse.json({
      isDatabaseConnected,
      isSetupCompleted: gateways.isSetupCompleted || Boolean(superAdmin),
      superAdminExists: Boolean(superAdmin),
      superAdminEmail: superAdmin?.email || superAdmin?.username || 'owner@poultry.com',
      gateways,
      databaseConfig,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      isDatabaseConnected: false,
      isSetupCompleted: false,
      error: err instanceof Error ? err.message : 'Failed to check system setup status',
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
      databaseType = 'supabase',
      postgresHost = '',
      postgresPort = 5432,
      postgresDb = '',
      postgresUser = '',
      postgresPassword = '',
      mysqlHost = '',
      mysqlPort = 3306,
      mysqlDatabase = '',
      mysqlUser = '',
      mysqlPassword = '',
      supabaseUrl = '',
      supabaseAnonKey = '',
      supabaseServiceRoleKey = '',
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

    const cleanEmail = superAdminEmail.trim().toLowerCase();
    const engine = databaseType === 'mysql' || databaseType === 'postgres' ? databaseType : 'supabase';

    // ---- Local database install (MySQL / PostgreSQL): fully independent of Supabase ----
    if (engine !== 'supabase') {
      try {
        const { ensureAuthSchema, upsertSuperAdmin, saveDatabaseConfig, resetDatabaseConfigCache } =
          await import('@/lib/authdb');

        const dbHost = engine === 'mysql' ? mysqlHost.trim() : postgresHost.trim();
        const dbName = engine === 'mysql' ? mysqlDatabase.trim() : postgresDb.trim();
        const dbUser = engine === 'mysql' ? mysqlUser.trim() : postgresUser.trim();
        const dbPassword = engine === 'mysql' ? mysqlPassword || '' : postgresPassword || '';

        if (!dbHost || !dbName || !dbUser) {
          return NextResponse.json(
            { error: `${engine === 'mysql' ? 'MySQL' : 'PostgreSQL'} connection details are required in the Database step.` },
            { status: 400 }
          );
        }

        const localConfig = engine === 'mysql'
          ? {
              engine: 'mysql' as const,
              mysql: { host: dbHost, port: Number(mysqlPort), database: dbName, user: dbUser, password: dbPassword },
            }
          : {
              engine: 'postgres' as const,
              postgres: { host: dbHost, port: Number(postgresPort), database: dbName, user: dbUser, password: dbPassword },
            };

        await ensureAuthSchema(localConfig);
        await upsertSuperAdmin(localConfig, cleanEmail, superAdminPassword);
        await saveDatabaseConfig(localConfig);
        resetDatabaseConfigCache();

        const localResponse = NextResponse.json({
          success: true,
          message: 'Platform Installation & Setup Completed Successfully!',
          superAdminEmail: cleanEmail,
          loginUrl: '/login',
          dashboardUrl: '/dashboard/admin',
        });
        localResponse.cookies.set('pfms_installation_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });
        localResponse.cookies.set('pms_db_mode', '1', { path: '/', maxAge: 60 * 60 * 24 * 365 });
        return localResponse;
      } catch (err: unknown) {
        console.error('Local Database Setup Error:', err);
        return NextResponse.json(
          { error: err instanceof Error ? err.message : 'Installation failed while configuring the local database.' },
          { status: 500 }
        );
      }
    }

    const supabaseUrlValue = supabaseUrl.trim();
    const supabaseRoleKeyValue = supabaseServiceRoleKey.trim();

    // Prefer the wizard-provided credentials; fall back to the .env client otherwise.
    const serviceRoleClient = supabaseUrlValue && supabaseRoleKeyValue
      ? createClient(supabaseUrlValue, supabaseRoleKeyValue, { auth: { persistSession: false } })
      : envServiceRoleClient;

    // Once installation has completed, only an authenticated Super Admin may re-run it.
    // This prevents unauthenticated callers from resetting the Super Admin credentials.
    const { data: existingConfig } = await serviceRoleClient
      .from('systemSettings')
      .select('adminName')
      .eq('id', 'gateways_config')
      .maybeSingle();

    let isSetupCompleted = false;
    if (existingConfig?.adminName) {
      try {
        const parsed = JSON.parse(existingConfig.adminName);
        isSetupCompleted = Boolean(parsed.isSetupCompleted);
      } catch (_e) {}
    }

    if (isSetupCompleted) {
      const authUser = await getAuthUser();
      const isSuperAdmin = Boolean(
        authUser &&
        (authUser.role === 'SuperAdmin' ||
          authUser.email === 'superadmin@pfms.com' ||
          authUser.email === 'owner@poultry.com')
      );

      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: 'Installation has already been completed. Please log in and use the Admin settings to manage the platform.' },
          { status: 403 }
        );
      }
    }

    // 1. Provision / Update Super Admin in Auth
    let userId = '';

    try {
      const { data: usersData } = await serviceRoleClient.auth.admin.listUsers();
      const existingUser = usersData?.users.find((u: any) => u.email?.toLowerCase() === cleanEmail);

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

    // 3. Save Database Driver Config
    const databaseDriverConfig = {
      databaseType,
      postgresHost: postgresHost.trim(),
      postgresPort: Number(postgresPort),
      postgresDb: postgresDb.trim(),
      postgresUser: postgresUser.trim(),
      postgresPassword: postgresPassword || '',
      mysqlHost: mysqlHost.trim(),
      mysqlPort: Number(mysqlPort),
      mysqlDatabase: mysqlDatabase.trim(),
      mysqlUser: mysqlUser.trim(),
      mysqlPassword: mysqlPassword || '',
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      supabaseServiceRoleKey: supabaseServiceRoleKey.trim(),
      updatedAt: new Date().toISOString(),
    };

    await serviceRoleClient.from('systemSettings').upsert([{
      id: 'database_config',
      workspaceId: 'global',
      adminName: JSON.stringify(databaseDriverConfig)
    }]);

    // 4. Save Gateways & System Configurations to systemSettings Table
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

    // 5. Update SaaS Pricing Configuration
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
  } catch (err: unknown) {
    console.error('Setup API Error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error during setup' }, { status: 500 });
  }
}
