'use strict';

import { NextResponse } from 'next/server';
import { createOwnerToken } from '@/lib/ownerAuth';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const rawUsername = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!rawUsername || !password) {
      return NextResponse.json(
        { error: 'Owner username/email and master password are required.' },
        { status: 400 }
      );
    }

    const username = rawUsername.toLowerCase();
    const userClean = username.includes('@') ? username.split('@')[0] : username;

    const envOwnerUser = (process.env.PFMS_ADMIN_USERNAME || 'owner').toLowerCase();
    const envOwnerPass = process.env.PFMS_ADMIN_PASSWORD || 'PoultryFarm@2026!';

    let isValid = false;

    // 1. Check default environment master owner credentials
    if (
      (username === envOwnerUser ||
        userClean === envOwnerUser ||
        username === 'owner@poultry.com' ||
        username === 'superadmin@pfms.com') &&
      password === envOwnerPass
    ) {
      isValid = true;
    }

    // 2. Check database users table for SuperAdmin or owner account
    if (!isValid) {
      try {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, email, passwordHash, role')
          .or(`role.eq.SuperAdmin,email.eq.owner@poultry.com,username.eq.owner,username.eq.${userClean},email.eq.${username}`)
          .limit(5);

        if (users && users.length > 0) {
          for (const u of users) {
            const uName = (u.username || '').toLowerCase();
            const uEmail = (u.email || '').toLowerCase();
            if (username === uName || username === uEmail || userClean === uName) {
              const hash = u.passwordHash || '';
              if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
                try {
                  if (bcrypt.compareSync(password, hash)) {
                    isValid = true;
                    break;
                  }
                } catch {}
              } else if (hash === password) {
                isValid = true;
                break;
              }
            }
          }
        }
      } catch (_e) {}
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid owner credentials or master password. Please verify and try again.' },
        { status: 401 }
      );
    }

    const token = createOwnerToken(userClean || 'owner');
    const response = NextResponse.json({ ok: true, redirect: '/setup' });

    response.cookies.set('pfms_setup_auth', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    response.cookies.set('pfms_role', 'SuperAdmin', { path: '/' });
    response.cookies.set('pfms_email', username.includes('@') ? username : 'owner@poultry.com', { path: '/' });

    return response;
  } catch (error: any) {
    console.error('Setup login error:', error);
    return NextResponse.json(
      { error: 'Server error during owner authentication.' },
      { status: 500 }
    );
  }
}
