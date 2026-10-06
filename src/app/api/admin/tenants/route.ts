'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { attachSession } from '@/lib/sessionCookies';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.role === 'SuperAdmin' && !user?.impersonatedBy;
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      // List all tenants
      let orgs: Record<string, unknown>[] = [];
      const { data: orgData } = await serviceRoleClient.from('organizations').select('*');
      if (orgData && Array.isArray(orgData)) orgs = [...orgData];

      try {
        const { data: adminUsers } = await serviceRoleClient.from('users').select('*');
        const { data: workspaces } = await serviceRoleClient.from('workspaces').select('*');
        const existingOrgIds = new Set(orgs.map((o: Record<string, unknown>) => o.id));

        if (adminUsers && Array.isArray(adminUsers)) {
          for (const u of adminUsers) {
            if (u.role !== 'Admin') continue;
            const userOrgId = u.orgId || (u.workspaceId ? `org_${u.workspaceId}` : `org_${u.username}`);
            if (!existingOrgIds.has(userOrgId)) {
              const farmWorkspace = workspaces?.find((w: Record<string, unknown>) => w.ownerUsername === u.username || w.id === u.workspaceId);
              const orgName = farmWorkspace?.name && farmWorkspace.name !== 'Main Branch'
                ? `${farmWorkspace.name} Farm`
                : `${u.username ? u.username.charAt(0).toUpperCase() + u.username.slice(1) : 'Farm'} Organization`;

              const newOrg = {
                id: userOrgId,
                name: orgName,
                subscriptionTier: u.subscriptionTier || 'free',
                subscriptionStatus: 'active',
                ownerUsername: u.username,
                ownerEmail: u.email,
                createdAt: u.createdAt || new Date().toISOString()
              };
              orgs.push(newOrg);
              existingOrgIds.add(userOrgId);
              await serviceRoleClient.from('organizations').upsert([newOrg]);
            }
          }
        }
      } catch (_syncErr) {}

      return NextResponse.json({ organizations: orgs || [] });
    }

    // Fetch detailed info for single tenant org
    const { data: org } = await serviceRoleClient
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Associated Workspaces / Branches
    const { data: workspaces } = await serviceRoleClient
      .from('workspaces')
      .select('*')
      .or(`ownerUsername.eq.${org.ownerUsername || ''},id.ilike.%${orgId}%`);

    // Owner info
    const { data: ownerUser } = await serviceRoleClient
      .from('users')
      .select('id, username, email, role, createdAt')
      .or(`email.eq.${org.ownerEmail || ''},username.eq.${org.ownerUsername || ''},orgId.eq.${orgId}`)
      .limit(1)
      .maybeSingle();

    // Staff count
    const workspaceIds = (workspaces || []).map((w: Record<string, unknown>) => w.id);
    let staffCount = 0;
    let batchesCount = 0;
    let eggsCount = 0;

    if (workspaceIds.length > 0) {
      const { count: sCount } = await serviceRoleClient
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .in('workspaceId', workspaceIds);
      staffCount = sCount || 0;

      const { count: bCount } = await serviceRoleClient
        .from('batches')
        .select('*', { count: 'exact', head: true })
        .in('workspaceId', workspaceIds);
      batchesCount = bCount || 0;

      const { data: eggData } = await serviceRoleClient
        .from('eggs')
        .select('goodEggs')
        .in('workspaceId', workspaceIds);
      if (eggData) {
        eggsCount = eggData.reduce((sum: number, e: Record<string, unknown>) => sum + Number(e.goodEggs || 0), 0);
      }
    }

    // Subscription billing history
    const { data: history } = await serviceRoleClient
      .from('subscription_history')
      .select('*')
      .or(`orgId.eq.${orgId},customerEmail.eq.${org.ownerEmail || ''}`)
      .order('createdAt', { ascending: false })
      .limit(10);

    return NextResponse.json({
      organization: org,
      workspaces: workspaces || [],
      owner: ownerUser || null,
      telemetry: {
        staffCount,
        batchesCount,
        eggsCount
      },
      history: history || []
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // Exit impersonation: ONLY valid for a verified, signed impersonation session.
    if (action === 'exit_impersonate') {
      if (!user.impersonatedBy) {
        return NextResponse.json({ error: 'No active impersonation session.' }, { status: 403 });
      }

      // Re-validate the original SuperAdmin against the database where possible.
      let restoredEmail = '';
      let restoredId = user.impersonatedBy;
      let restoredName = 'Super Admin';

      const { data: superRec } = await serviceRoleClient
        .from('users')
        .select('id, email, username, role')
        .eq('id', user.impersonatedBy)
        .limit(1)
        .maybeSingle();

      if (superRec) {
        if (superRec.role !== 'SuperAdmin') {
          return NextResponse.json({ error: 'Original account is no longer a Super Admin.' }, { status: 403 });
        }
        restoredId = superRec.id;
        restoredEmail = superRec.email || '';
        restoredName = superRec.username || restoredName;
      } else if (user.impersonatedBy !== 'env_superadmin' && !user.impersonatedBy.startsWith('setup_')) {
        // Unknown impersonator id that isn't a known non-DB SuperAdmin identity
        return NextResponse.json({ error: 'Original Super Admin account not found.' }, { status: 403 });
      }

      const response = NextResponse.json({
        success: true,
        message: 'Exited impersonation successfully. Restored Super Admin access.',
        redirectUrl: '/dashboard/admin?tab=orgs'
      });
      return attachSession(response, {
        userId: restoredId,
        email: restoredEmail || user.impersonatorEmail || '',
        role: 'SuperAdmin',
        orgId: 'org_superadmin',
        workspaceId: 'org_superadmin',
        name: restoredName,
        tier: 'enterprise',
      }, { request });
    }

    const isSuperAdmin = user.role === 'SuperAdmin' && !user.impersonatedBy;
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    if (action === 'create') {
      const { name, adminEmail, adminName, password, packageId, branchName } = body;
      if (!name || !adminEmail) {
        return NextResponse.json({ error: 'Farm Organization Name and Admin Email are required.' }, { status: 400 });
      }

      const emailClean = adminEmail.trim().toLowerCase();
      const userClean = emailClean.split('@')[0];
      const orgId = `org_${Date.now()}`;
      const defaultWorkspaceId = `main-${orgId}`;
      const generatedPassword = crypto.randomBytes(9).toString('base64url');
      const defaultPassword = password?.trim() || generatedPassword;
      const passwordHash = bcrypt.hashSync(defaultPassword, 10);
      const newUserId = `u_${Date.now()}`;
      const assignedTier = packageId || 'free';
      const initialBranch = branchName?.trim() || 'Main Branch';

      // 1. Check existing user
      const { data: existingUsers } = await serviceRoleClient
        .from('users')
        .select('id, email')
        .eq('email', emailClean)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json({ error: `User with email ${emailClean} already exists.` }, { status: 400 });
      }

      // 2. Insert User
      await serviceRoleClient.from('users').insert([{
        id: newUserId,
        username: userClean,
        name: adminName || userClean,
        email: emailClean,
        passwordHash: passwordHash,
        role: 'Admin',
        workspaceId: defaultWorkspaceId,
        orgId: orgId
      }]);

      // 3. Insert Organization
      const newOrg = {
        id: orgId,
        name: name.trim(),
        subscriptionTier: assignedTier,
        subscriptionStatus: 'active',
        ownerId: newUserId,
        ownerUsername: userClean,
        ownerEmail: emailClean,
        createdAt: new Date().toISOString()
      };
      await serviceRoleClient.from('organizations').insert([newOrg]);

      // 4. Insert Primary Workspace / Branch
      await serviceRoleClient.from('workspaces').insert([{
        id: defaultWorkspaceId,
        name: initialBranch,
        type: 'Layer Farm',
        ownerUsername: userClean,
        createdAt: new Date().toISOString()
      }]);

      return NextResponse.json({
        success: true,
        message: `Farm tenant "${name}" created successfully with ${assignedTier} plan!`,
        tenant: newOrg,
        initialCredentials: {
          email: emailClean,
          password: defaultPassword
        }
      });
    }

    if (action === 'update') {
      const { id, name, subscriptionTier, subscriptionStatus } = body;
      if (!id) {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString()
      };
      if (name) updates.name = name.trim();

      const targetTier = subscriptionTier ? subscriptionTier.trim().toLowerCase() : undefined;
      const targetStatus = subscriptionStatus ? subscriptionStatus.trim().toLowerCase() : undefined;

      const isPaidTier = targetTier === 'pro' || targetTier === 'enterprise' || targetTier === 'entrepreneur' || targetTier === 'enterprise_plus';

      if (targetTier) {
        updates.subscriptionTier = targetTier;
        if (isPaidTier) {
          updates.subscriptionStatus = targetStatus || 'active';
          // Extend subscription end date by 1 full year (365 days) so the manual upgrade is immediately active
          updates.subscriptionEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          updates.subscriptionStatus = targetStatus || 'active';
          updates.subscriptionEndsAt = null;
        }
      } else if (targetStatus) {
        updates.subscriptionStatus = targetStatus;
      }

      // 1. Update organizations table
      const { error: updateErr } = await serviceRoleClient
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // 2. Fetch organization to get owner info
      const { data: org } = await serviceRoleClient
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // 3. Update users table for all users under this tenant
      if (targetTier) {
        await serviceRoleClient
          .from('users')
          .update({
            subscriptionTier: targetTier,
            updatedAt: new Date().toISOString()
          })
          .eq('orgId', id);

        if (org?.ownerUsername) {
          await serviceRoleClient
            .from('users')
            .update({
              subscriptionTier: targetTier,
              updatedAt: new Date().toISOString()
            })
            .eq('username', org.ownerUsername);
        }
      }

      // 4. Update workspaces table (name) if name was updated
      if (name) {
        await serviceRoleClient
          .from('workspaces')
          .update({
            name: name.trim(),
            updatedAt: new Date().toISOString()
          })
          .or(`orgId.eq.${id},id.eq.main-${id}`);
      }

      // 5. Update / Upsert systemSettings for the tenant's workspace
      try {
        const featureSettings: Record<string, unknown> = {
          updatedAt: new Date().toISOString()
        };
        if (name) featureSettings.farmName = name.trim();
        if (targetTier) {
          featureSettings.subscriptionTier = targetTier;
          featureSettings.plan = targetTier;
          featureSettings.cctvEnabled = isPaidTier;
          featureSettings.aiLoggerEnabled = isPaidTier;
          featureSettings.exportReportsEnabled = isPaidTier;
          featureSettings.enterpriseHubEnabled = targetTier === 'enterprise' || targetTier === 'entrepreneur' || targetTier === 'enterprise_plus';
          featureSettings.maxUsers = (targetTier === 'enterprise' || targetTier === 'entrepreneur' || targetTier === 'enterprise_plus') ? 100 : (targetTier === 'pro' ? 25 : 3);
          featureSettings.maxBirds = (targetTier === 'enterprise' || targetTier === 'entrepreneur' || targetTier === 'enterprise_plus') ? 1000000 : (targetTier === 'pro' ? 50000 : 2000);
        }

        // Upsert for sys-${id}
        await serviceRoleClient.from('systemSettings').upsert([{
          id: `sys-${id}`,
          workspaceId: `main-${id}`,
          ...featureSettings
        }]);
      } catch (_settingErr) {}

      // 6. Upsert subscriptions record
      if (targetTier) {
        try {
          await serviceRoleClient.from('subscriptions').upsert([{
            id: `admin_grant_${id}`,
            orgId: id,
            status: updates.subscriptionStatus || 'active',
            plan: targetTier,
            currentPeriodEnd: isPaidTier 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
              : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]);
        } catch (_subErr) {}
      }

      return NextResponse.json({ 
        success: true, 
        message: `Tenant account updated successfully! Plan set to "${targetTier || org?.subscriptionTier || 'current'}" and active with all feature switches enabled.` 
      });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
      }

      // 1. Fetch organization to check owner
      const { data: org } = await serviceRoleClient
        .from('organizations')
        .select('id, ownerUsername, ownerEmail')
        .eq('id', id)
        .maybeSingle();

      // 2. Cascade cleanup related records to satisfy foreign keys and clear dependencies
      await serviceRoleClient.from('organization_members').delete().eq('orgId', id);
      await serviceRoleClient.from('subscriptions').delete().eq('orgId', id);
      await serviceRoleClient.from('subscription_history').delete().eq('orgId', id);
      await serviceRoleClient.from('systemSettings').delete().or(`id.eq.sys-${id},workspaceId.ilike.%${id}%`);
      await serviceRoleClient.from('workspaces').delete().or(`id.ilike.%${id}%`);
      
      if (org?.ownerUsername && org.ownerUsername !== 'owner' && org.ownerUsername !== 'superadmin') {
        await serviceRoleClient.from('users').delete().eq('username', org.ownerUsername);
      }
      await serviceRoleClient.from('users').delete().eq('orgId', id);

      // 3. Delete the organization
      const { error: delErr } = await serviceRoleClient.from('organizations').delete().eq('id', id);
      if (delErr) {
        return NextResponse.json({ error: 'Failed to delete organization: ' + (delErr.message || String(delErr)) }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Tenant organization and all associated data deleted successfully' });
    }

    if (action === 'impersonate') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
      }

      const { data: org } = await serviceRoleClient
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!org) {
        return NextResponse.json({ error: 'Tenant organization not found' }, { status: 404 });
      }

      // Find user
      const { data: targetUser } = await serviceRoleClient
        .from('users')
        .select('*')
        .or(`email.eq.${org.ownerEmail || ''},username.eq.${org.ownerUsername || ''},orgId.eq.${id}`)
        .limit(1)
        .maybeSingle();

      // Find workspace
      const { data: workspaces } = await serviceRoleClient
        .from('workspaces')
        .select('*')
        .or(`ownerUsername.eq.${org.ownerUsername || ''},id.ilike.%${id}%`)
        .limit(1);

      const targetWorkspaceId = targetUser?.workspaceId || workspaces?.[0]?.id || `main-${id}`;
      const targetEmail = targetUser?.email || org.ownerEmail || 'tenant@poultry.local';
      const targetUserId = targetUser?.id || org.ownerId || 'tenant_user';

      const response = NextResponse.json({
        success: true,
        message: `Impersonating ${org.name} (${targetEmail}). Redirecting to farm dashboard...`,
        redirectUrl: '/dashboard'
      });

      return attachSession(response, {
        userId: targetUserId,
        email: targetEmail,
        role: 'Admin',
        orgId: id,
        workspaceId: targetWorkspaceId,
        tier: org.subscriptionTier || 'free',
        name: org.name,
        impersonatedBy: String(user.id),
        impersonatorEmail: String(user.email || ''),
        impersonatedOrgName: org.name,
      }, { request, maxAge: 60 * 60 * 24 });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Operation failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.role === 'SuperAdmin' && !user?.impersonatedBy;
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const { data: org } = await serviceRoleClient
      .from('organizations')
      .select('id, ownerUsername, ownerEmail')
      .eq('id', id)
      .maybeSingle();

    await serviceRoleClient.from('organization_members').delete().eq('orgId', id);
    await serviceRoleClient.from('subscriptions').delete().eq('orgId', id);
    await serviceRoleClient.from('subscription_history').delete().eq('orgId', id);
    await serviceRoleClient.from('systemSettings').delete().or(`id.eq.sys-${id},workspaceId.ilike.%${id}%`);
    await serviceRoleClient.from('workspaces').delete().or(`id.ilike.%${id}%`);

    if (org?.ownerUsername && org.ownerUsername !== 'owner' && org.ownerUsername !== 'superadmin') {
      await serviceRoleClient.from('users').delete().eq('username', org.ownerUsername);
    }
    await serviceRoleClient.from('users').delete().eq('orgId', id);

    const { error: delErr } = await serviceRoleClient.from('organizations').delete().eq('id', id);
    if (delErr) {
      return NextResponse.json({ error: 'Failed to delete organization: ' + (delErr.message || String(delErr)) }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Failed to delete tenant' }, { status: 500 });
  }
}
