'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { generateTwoFactorSecret, verifyTwoFactorCode } from '@/lib/twoFactor';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: users } = await supabase
      .from('users')
      .select('id, email, username, twoFactorEnabled, twoFactorSecret')
      .eq('id', authUser.id)
      .limit(1);

    const user = users?.[0];
    const isEnabled = user?.twoFactorEnabled === 'true' || user?.twoFactorEnabled === true;

    if (isEnabled) {
      return NextResponse.json({
        enabled: true,
      });
    }

    // Generate setup secret for user to scan with Authenticator App
    const userEmail = user?.email || authUser.email || 'user@poultry.local';
    const setup = generateTwoFactorSecret(userEmail, 'PoultryFarm');

    return NextResponse.json({
      enabled: false,
      setupSecret: setup.secret,
      otpauthUrl: setup.otpauthUrl,
      qrCodeUrl: setup.qrCodeUrl,
    });
  } catch (err) {
    const msg = (err as { message?: string })?.message || 'Failed to fetch 2FA status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, code, secret } = body;

    if (action === 'enable') {
      if (!code || !secret) {
        return NextResponse.json({ error: 'Code and secret are required' }, { status: 400 });
      }

      const isValid = verifyTwoFactorCode(secret, code);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid 6-digit code. Ensure your device clock is synchronized.' }, { status: 400 });
      }

      // Update user with 2FA secret and enabled status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          twoFactorEnabled: 'true',
          twoFactorSecret: secret,
        })
        .eq('id', authUser.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update 2FA in database' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Two-Factor Authentication (2FA) successfully activated!',
      });
    }

    if (action === 'disable') {
      const { password } = body;
      
      // Verify user's current password before disabling 2FA if password provided
      if (password) {
        const { data: users } = await supabase
          .from('users')
          .select('passwordHash')
          .eq('id', authUser.id)
          .limit(1);

        const currentHash = users?.[0]?.passwordHash;
        if (currentHash) {
          const valid = bcrypt.compareSync(password, currentHash);
          if (!valid) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
          }
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          twoFactorEnabled: 'false',
          twoFactorSecret: '',
        })
        .eq('id', authUser.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to disable 2FA in database' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Two-Factor Authentication (2FA) has been disabled.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const msg = (err as { message?: string })?.message || 'Failed to update 2FA settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
