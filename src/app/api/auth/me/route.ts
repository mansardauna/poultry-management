'use strict';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

/**
 * Returns the identity derived solely from the verified session.
 * Raw cookies / headers are not consulted.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, role: null, user: null });
    }
    return NextResponse.json({
      authenticated: true,
      role: user.role,
      impersonating: Boolean(user.impersonatedBy),
      user,
    });
  } catch {
    return NextResponse.json({ authenticated: false, role: null, user: null });
  }
}
