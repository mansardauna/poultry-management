'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { getTenantWorkspaces } from '@/lib/workspace';
import { cookies } from 'next/headers';

/** Exported function GET */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workspaces = await getTenantWorkspaces(user);
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

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get('pfms_org_id')?.value || '';

  let orgId = cookieOrgId;

  if (!orgId) {
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .maybeSingle();
    if (memberData?.orgId) {
      orgId = memberData.orgId;
    } else {
      orgId = `org_${user.id.replace(/-/g, '').slice(0, 10)}`;
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

  await supabase.from('workspaces').upsert([createdWorkspace]);
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
