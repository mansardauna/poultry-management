'use strict';

import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.email === 'owner@poultry.com' || user?.role === 'SuperAdmin';
    if (!user || !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      // List all tenants
      const { data: orgs } = await serviceRoleClient.from('organizations').select('*');
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
    const workspaceIds = (workspaces || []).map((w: any) => w.id);
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
        eggsCount = eggData.reduce((sum: number, e: any) => sum + Number(e.goodEggs || 0), 0);
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
  } catch (err: any) {
    console.error('Tenant GET Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch tenant' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const isSuperAdmin = user?.email === 'superadmin@pfms.com' || user?.email === 'owner@poultry.com' || user?.role === 'SuperAdmin';
    
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    // Handle exit_impersonate even if user role was temporarily switched
    if (action === 'exit_impersonate') {
      const response = NextResponse.json({
        success: true,
        message: 'Exited impersonation successfully. Restored Super Admin access.',
        redirectUrl: '/dashboard/admin?tab=orgs'
      });
      response.cookies.delete('pfms_impersonate_by');
      response.cookies.delete('pfms_impersonate_org_name');
      response.cookies.set('pfms_role', 'SuperAdmin', { path: '/', maxAge: 60 * 60 * 24 * 7 });
      response.cookies.set('pfms_email', 'owner@poultry.com', { path: '/', maxAge: 60 * 60 * 24 * 7 });
      response.cookies.set('pfms_workspace', 'main-org_owner_main', { path: '/', maxAge: 60 * 60 * 24 * 7 });
      response.cookies.set('pfms_org_id', 'global', { path: '/', maxAge: 60 * 60 * 24 * 7 });
      return response;
    }

    if (!user || !isSuperAdmin) {
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
      const defaultPassword = password?.trim() || 'FarmAdmin123!';
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

      const updates: any = {};
      if (name) updates.name = name.trim();
      if (subscriptionTier) updates.subscriptionTier = subscriptionTier.trim();
      if (subscriptionStatus) updates.subscriptionStatus = subscriptionStatus.trim();

      const { error: updateErr } = await serviceRoleClient
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Tenant updated successfully!' });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
      }

      await serviceRoleClient.from('organizations').delete().eq('id', id);
      return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
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

      // Issue impersonation cookies
      response.cookies.set('pfms_impersonate_by', 'superadmin', { path: '/', maxAge: 60 * 60 * 24 });
      response.cookies.set('pfms_impersonate_org_name', org.name, { path: '/', maxAge: 60 * 60 * 24 });
      response.cookies.set('pfms_role', 'Admin', { path: '/', maxAge: 60 * 60 * 24 });
      response.cookies.set('pfms_email', targetEmail, { path: '/', maxAge: 60 * 60 * 24 });
      response.cookies.set('pfms_user_id', targetUserId, { path: '/', maxAge: 60 * 60 * 24 });
      response.cookies.set('pfms_org_id', id, { path: '/', maxAge: 60 * 60 * 24 });
      response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/', maxAge: 60 * 60 * 24 });

      return response;
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Tenant POST Error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
