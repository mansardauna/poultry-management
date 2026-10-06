'use strict';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as envServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { isSystemInstalled } from '@/lib/dbCheck';
import { loadDatabaseConfig } from '@/lib/authdb';
import { APP_VERSION } from '@/lib/version';
import { attachSession } from '@/lib/sessionCookies';

/**
 * GET Handler: Check system setup status, database connectivity, and gateway configurations
 */
export async function GET() {
  try {
    const installed = await isSystemInstalled();
    if (installed) {
      const user = await getAuthUser();
      if (!user || user.role !== 'SuperAdmin') {
        return NextResponse.json({ error: 'Unauthorized: Setup access restricted to SuperAdmin.' }, { status: 403 });
      }
    }

    // 1. Verify database connection
    const { error: dbError } = await envServiceRoleClient
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
      currencySymbol: '$',
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

    // Inspect active real file-based / runtime database configuration
    const activeEngineConfig = await loadDatabaseConfig();
    if (activeEngineConfig?.engine) {
      databaseConfig.databaseType = activeEngineConfig.engine;
      if (activeEngineConfig.engine === 'mysql' && activeEngineConfig.mysql) {
        databaseConfig.mysqlHost = activeEngineConfig.mysql.host || 'localhost';
        databaseConfig.mysqlPort = activeEngineConfig.mysql.port || 3306;
        databaseConfig.mysqlDatabase = activeEngineConfig.mysql.database || 'poultry_db';
        databaseConfig.mysqlUser = activeEngineConfig.mysql.user || 'root';
      } else if (activeEngineConfig.engine === 'postgres' && activeEngineConfig.postgres) {
        databaseConfig.postgresHost = activeEngineConfig.postgres.host || 'localhost';
        databaseConfig.postgresPort = activeEngineConfig.postgres.port || 5432;
        databaseConfig.postgresDb = activeEngineConfig.postgres.database || 'poultry_db';
        databaseConfig.postgresUser = activeEngineConfig.postgres.user || 'postgres';
      }
    }

    // 4. Check Super Admin exists
    const { data: superAdmin } = await envServiceRoleClient
      .from('users')
      .select('id, username, email, role')
      .eq('role', 'SuperAdmin')
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

    // 5. Query tenant organizations count
    let tenantsCount = 0;
    try {
      const { data: orgData } = await envServiceRoleClient.from('organizations').select('id');
      if (orgData) tenantsCount = orgData.length;
    } catch (_e) {}

    return NextResponse.json({
      isDatabaseConnected,
      isSetupCompleted: gateways.isSetupCompleted || Boolean(superAdmin),
      superAdminExists: Boolean(superAdmin),
      superAdminEmail: superAdmin?.email || superAdmin?.username || '',
      gateways,
      databaseConfig,
      tenantsCount,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      isDatabaseConnected: false,
      isSetupCompleted: false,
      error: err instanceof Error ? err.message : 'Failed to check system setup status',
    }, { status: 500 });
  }
}

// In-memory atomic setup lock to prevent concurrent first-run race conditions
let isSetupInProgress = false;

/**
 * POST Handler: Process System Setup & Initial Deployment Configuration
 */
export async function POST(request: Request) {
  if (isSetupInProgress) {
    return NextResponse.json(
      { error: 'Setup installation is already in progress. Please wait for completion.' },
      { status: 409 }
    );
  }

  isSetupInProgress = true;
  try {
    const installed = await isSystemInstalled();
    if (installed) {
      const user = await getAuthUser();
      if (!user || user.role !== 'SuperAdmin') {
        return NextResponse.json({ error: 'Access denied: System is already installed. Re-running the installer is prohibited.' }, { status: 403 });
      }
    } else {
      // First-run protection: check if deployment environment specifies a SETUP_TOKEN / SETUP_SECRET
      const requiredSetupToken = process.env.SETUP_TOKEN || process.env.SETUP_SECRET;
      if (requiredSetupToken) {
        const headerToken = request.headers.get('x-setup-token');
        const urlToken = new URL(request.url).searchParams.get('token');
        const bodyClone = await request.clone().json().catch(() => ({}));
        const providedToken = headerToken || urlToken || bodyClone?.setupToken;

        if (!providedToken || providedToken !== requiredSetupToken) {
          return NextResponse.json(
            { error: 'Unauthorized: Invalid or missing SETUP_TOKEN. First-run setup requires authorization.' },
            { status: 401 }
          );
        }
      }
    }

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
      currencySymbol = '$',
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
        return attachSession(localResponse, {
          userId: `setup_${cleanEmail}`,
          email: cleanEmail,
          role: 'SuperAdmin',
          orgId: 'org_superadmin',
          workspaceId: 'org_superadmin',
          name: 'Super Admin',
          tier: 'enterprise',
        }, { request });
      } catch (err: unknown) {
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
      return NextResponse.json(
        { error: 'Setup is permanently locked: installation has already been completed.' },
        { status: 403 }
      );
    }

    // 1. Provision / Update Super Admin in Auth
    let userId = '';

    try {
      const { data: usersData } = await serviceRoleClient.auth.admin.listUsers();
      const existingUser = usersData?.users.find((u: { email?: string }) => u.email?.toLowerCase() === cleanEmail);

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
    } catch (_err) {
      // Graceful fallback
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

    // Save initial system version
    await serviceRoleClient.from('systemSettings').upsert([{
      id: 'app_version',
      workspaceId: 'global',
      adminName: JSON.stringify({ version: APP_VERSION, installedAt: new Date().toISOString() })
    }]);

    const response = NextResponse.json({
      success: true,
      message: 'Platform Installation & Setup Completed Successfully!',
      superAdminEmail: cleanEmail,
      loginUrl: '/login',
      dashboardUrl: '/dashboard/admin',
    });

    // Set installation flag and a signed SuperAdmin session
    response.cookies.set('pfms_installation_completed', 'true', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return attachSession(response, {
      userId: userId || `setup_${cleanEmail}`,
      email: cleanEmail,
      role: 'SuperAdmin',
      orgId: 'org_superadmin',
      workspaceId: 'org_superadmin',
      name: 'Super Admin',
      tier: 'enterprise',
    }, { request });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error during setup' }, { status: 500 });
  } finally {
    isSetupInProgress = false;
  }
}
