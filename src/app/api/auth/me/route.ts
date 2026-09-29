'use strict';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { cookies, headers } from 'next/headers';

export async function GET() {
  try {
    const user = await getAuthUser();
    const cookieStore = await cookies();
    const headersList = await headers().catch(() => null);
    const workspace = cookieStore.get('pfms_workspace')?.value;
    const orgId = cookieStore.get('pfms_org_id')?.value;
    const roleCookie = cookieStore.get('pfms_role')?.value;
    const emailCookie = cookieStore.get('pfms_email')?.value;
    const headerRole = headersList?.get('x-user-role');
    const headerEmail = headersList?.get('x-user-email');

    const isSuperAdmin = 
      user?.role === 'SuperAdmin' ||
      roleCookie === 'SuperAdmin' ||
      headerRole === 'SuperAdmin' ||
      user?.email === 'owner@poultry.com' ||
      user?.email === 'superadmin@pfms.com' ||
      emailCookie === 'owner@poultry.com' ||
      emailCookie === 'superadmin@pfms.com' ||
      headerEmail === 'owner@poultry.com' ||
      headerEmail === 'superadmin@pfms.com';

    const role = isSuperAdmin ? 'SuperAdmin' : (user?.role || roleCookie || headerRole || 'Admin');
    const authenticated = !!user || isSuperAdmin || (!!workspace && !!orgId);

    return NextResponse.json({
      authenticated,
      role,
      user: user || null,
    });
  } catch {
    return NextResponse.json({ authenticated: false, role: 'Staff', user: null });
  }
}
