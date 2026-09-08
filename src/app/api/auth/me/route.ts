'use strict';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const user = await getAuthUser();
    const cookieStore = await cookies();
    const workspace = cookieStore.get('pfms_workspace')?.value;
    const orgId = cookieStore.get('pfms_org_id')?.value;

    const authenticated = !!user || (!!workspace && !!orgId);

    return NextResponse.json({
      authenticated,
      user: user || null,
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
