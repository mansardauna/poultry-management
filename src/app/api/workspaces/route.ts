'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

/** Exported function GET */
export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgIdMatch = request.headers.get('cookie')?.match(/pfms_org_id=([^;]+)/);
  let orgId = orgIdMatch ? orgIdMatch[1] : '';

  const userEmail = user.email || '';
  const userClean = userEmail.split('@')[0];

  // 1. Check if user is a Staff or Manager with assigned workspace / branches
  const { data: staffRec } = await supabase
    .from('staff')
    .select('workspaceId, assignedBranches')
    .or(`name.eq.${userEmail},contact.eq.${userEmail},name.eq.${userClean}`)
    .limit(1)
    .maybeSingle();

  const { data: userRec } = await supabase
    .from('users')
    .select('workspaceId, role')
    .or(`username.eq.${userClean},email.eq.${userEmail}`)
    .limit(1)
    .maybeSingle();

  const targetWsId = staffRec?.assignedBranches?.[0] || staffRec?.workspaceId || userRec?.workspaceId;
  const isStaffOrManager = user.role === 'Staff' || user.role === 'Manager' || userRec?.role === 'Staff' || userRec?.role === 'Manager';

  if (targetWsId) {
    const { data: assignedWorkspaces } = await supabase
      .from('workspaces')
      .select('*')
      .or(`id.eq.${targetWsId},id.like.%${targetWsId}%`);

    if (assignedWorkspaces && assignedWorkspaces.length > 0) {
      return NextResponse.json(assignedWorkspaces);
    }
  }

  if (!orgId) {
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .maybeSingle();
    if (memberData?.orgId) {
      orgId = memberData.orgId;
    }
  }

  const owner = userClean.toLowerCase();

  let query = supabase.from('workspaces').select('*');

  if (orgId) {
    query = query.like('id', `%${orgId}%`);
  } else if (!isStaffOrManager) {
    query = query.eq('ownerUsername', owner);
  }

  let { data: workspaces } = await query;

  // 2. Fallback for Staff/Manager: If still empty, return ALL existing farm workspaces
  if ((!workspaces || workspaces.length === 0) && isStaffOrManager) {
    const { data: allWorkspaces } = await supabase.from('workspaces').select('*').order('createdAt', { ascending: true });
    if (allWorkspaces && allWorkspaces.length > 0) {
      return NextResponse.json(allWorkspaces);
    }
  }

  if (!workspaces || workspaces.length === 0) {
    // Automatically initialize a clean, isolated branch ONLY for new admins/owners
    const isolatedId = orgId ? `main-${orgId}` : `ws_${user.id.replace(/-/g, '')}`;
    const defaultBranch = {
      id: isolatedId,
      name: `${owner.toUpperCase()} Farm Branch`,
      type: 'Main',
      createdAt: new Date().toISOString(),
      ownerUsername: owner
    };

    await supabase.from('workspaces').insert([defaultBranch]);
    return NextResponse.json([defaultBranch]);
  }

  return NextResponse.json(workspaces);
}

/** Exported function POST */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body?.id || !body?.name || !body?.type) {
    return NextResponse.json({ error: 'Missing workspace id, name, or type' }, { status: 400 });
  }

  const orgIdMatch = request.headers.get('cookie')?.match(/pfms_org_id=([^;]+)/);
  let orgId = orgIdMatch ? orgIdMatch[1] : '';

  if (!orgId) {
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .single();
    if (memberData?.orgId) {
      orgId = memberData.orgId;
    }
  }

  const owner = (user.email?.split('@')[0] || 'admin').toLowerCase();
  const finalId = orgId && !body.id.includes(orgId) ? `${body.id}-${orgId}` : body.id;

  const createdWorkspace = {
    id: finalId,
    name: body.name,
    type: body.type,
    createdAt: new Date().toISOString(),
    ownerUsername: owner,
  };

  await supabase.from('workspaces').insert([createdWorkspace]);
  return NextResponse.json(createdWorkspace, { status: 201 });
}

/** Exported function PUT */
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, type } = body;

  if (!id || !name || !type) {
    return NextResponse.json({ error: 'Missing id, name, or type' }, { status: 400 });
  }

  await supabase.from('workspaces')
    .update({ name, type })
    .eq('id', id);

  return NextResponse.json({ success: true });
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing workspace id' }, { status: 400 });
  }

  await supabase.from('workspaces').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
