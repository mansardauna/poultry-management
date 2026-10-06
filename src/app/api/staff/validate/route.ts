'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Real-time validation endpoint for staff login credentials.
 * Performs a global search across BOTH `users` and `staff` tables
 * across ALL workspaces to ensure strict uniqueness and prevent impersonation.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUsername = searchParams.get('username') || searchParams.get('email') || '';
    const excludeStaffId = searchParams.get('excludeStaffId') || '';

    const cleanUsername = rawUsername.trim().toLowerCase();
    if (!cleanUsername) {
      return NextResponse.json({ available: true });
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json({
        available: false,
        error: 'Username must be at least 3 characters long.'
      });
    }

    const poultryEmail = `${cleanUsername}@poultry.local`;

    // 1. Global check on `users` table across all workspaces (no workspace filter)
    const { data: userMatches } = await supabase
      .from('users')
      .select('id, username, email, workspaceId')
      .or(`username.eq.${cleanUsername},email.eq.${cleanUsername},email.eq.${poultryEmail}`);

    // 2. Global check on `staff` table across all workspaces (no workspace filter)
    const { data: staffMatches } = await supabase
      .from('staff')
      .select('id, username, name, workspaceId')
      .or(`username.eq.${cleanUsername},name.eq.${cleanUsername}`);

    const existingUsers = (userMatches || []).filter((u: Record<string, unknown>) => {
      if (excludeStaffId && (u.id === excludeStaffId || u.id === `usr_${excludeStaffId}`)) {
        return false;
      }
      return true;
    });

    const existingStaff = (staffMatches || []).filter((s: Record<string, unknown>) => {
      if (excludeStaffId && s.id === excludeStaffId) {
        return false;
      }
      return true;
    });

    if (existingUsers.length > 0 || existingStaff.length > 0) {
      return NextResponse.json({
        available: false,
        error: `Username "${cleanUsername}" is already taken across the platform. Please choose a different username to prevent impersonation.`
      });
    }

    return NextResponse.json({
      available: true,
      message: 'Username is unique and available.'
    });
  } catch (err) {
    return NextResponse.json({
      available: true,
      error: 'Validation bypassed: ' + ((err as { message?: string })?.message || '')
    });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawUsername = body.username || body.email || '';
  const excludeStaffId = body.excludeStaffId || '';

  const cleanUsername = (typeof rawUsername === 'string' ? rawUsername : '').trim().toLowerCase();
  if (!cleanUsername) {
    return NextResponse.json({ available: true });
  }

  const dummyUrl = new URL(`http://localhost/api/staff/validate?username=${encodeURIComponent(cleanUsername)}&excludeStaffId=${encodeURIComponent(excludeStaffId)}`);
  return GET(new Request(dummyUrl.toString()));
}
