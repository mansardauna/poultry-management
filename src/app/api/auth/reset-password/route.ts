'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { isSupabaseMode } from '@/lib/authdb';
import bcrypt from 'bcryptjs';
import { createResetToken, verifyResetToken, consumeResetToken } from '@/lib/resetTokenStore';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

function localIdentifierPart(email: string): string {
  return email.split('@')[0].toLowerCase();
}

async function findLocalUser(identifier: string) {
  const clean = identifier.trim().toLowerCase();
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${clean},username.eq.${clean},username.eq.${localIdentifierPart(clean)}`)
    .limit(1);
  return (users && users.length > 0) ? users[0] : null;
}

async function updateLocalPassword(userId: string, newPassword: string): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from('users')
    .update({ passwordHash })
    .eq('id', userId);
  return !error;
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const { action, email, token, currentPassword, newPassword } = body;

    const ip = getClientIp(request);

    // =========================================================================
    // 1. ACTION: REQUEST VERIFICATION TOKEN / CODE
    // =========================================================================
    if (action === 'request_token') {
      if (!email || typeof email !== 'string' || !email.trim()) {
        return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Rate limit: max 5 requests per 15 minutes per IP + email
      const rateCheck = rateLimit(`reset_req:${ip}:${cleanEmail}`, { windowMs: 15 * 60 * 1000, max: 5 });
      if (!rateCheck.success) {
        return NextResponse.json(
          { error: `Too many password reset requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
          { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
        );
      }
      
      // Check if user exists
      const user = await findLocalUser(cleanEmail);

      if (!user) {
        return NextResponse.json({
          error: 'No account registered with this email address. Please check your email or create an account.',
        }, { status: 400 });
      }

      const { emailSent, error: sendError } = await createResetToken(cleanEmail);

      if (!emailSent) {
        return NextResponse.json({
          error: sendError || 'Failed to dispatch verification email. Please verify that the email provider is configured.',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'A 6-digit verification code has been dispatched to your email address.',
      });
    }

    // =========================================================================
    // 2. ACTION: VERIFY TOKEN / CODE
    // =========================================================================
    if (action === 'verify_token') {
      const rateCheck = rateLimit(`verify_token:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 });
      if (!rateCheck.success) {
        return NextResponse.json(
          { error: `Too many verification attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
          { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
        );
      }

      if (!email || !token) {
        return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
      }

      const verifyResult = verifyResetToken(email, token);
      if (!verifyResult.valid) {
        return NextResponse.json({ error: verifyResult.error || 'Invalid or expired verification code' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code verified successfully. You may now specify a new password.',
      });
    }

    // =========================================================================
    // 3. ACTION: CONFIRM RESET (WITH TOKEN & NEW PASSWORD)
    // =========================================================================
    if (action === 'confirm_reset') {
      const rateCheck = rateLimit(`confirm_reset:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 });
      if (!rateCheck.success) {
        return NextResponse.json(
          { error: `Too many password reset attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
          { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
        );
      }

      if (!email || !token || !newPassword) {
        return NextResponse.json({ error: 'Email, verification code, and new password are required' }, { status: 400 });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const consumeResult = consumeResetToken(email, token);
      if (!consumeResult.valid) {
        return NextResponse.json({ error: consumeResult.error || 'Invalid or expired verification code' }, { status: 400 });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await findLocalUser(cleanEmail);

      if (user) {
        const ok = await updateLocalPassword(user.id, newPassword);
        if (!ok) {
          return NextResponse.json({ error: 'Failed to update password in database' }, { status: 500 });
        }
      }

      // Also sync Supabase Auth if running in Supabase mode
      if (await isSupabaseMode()) {
        try {
          const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
          const authAccount = authUsers?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (authAccount?.id) {
            await supabase.auth.admin.updateUserById(authAccount.id, { password: newPassword });
          }
        } catch (_listErr) {}
      }

      return NextResponse.json({
        success: true,
        message: 'Your password has been reset successfully! You can now log in with your new password.',
      });
    }

    // =========================================================================
    // 4. LEGACY / AUTHENTICATED USER PASSWORD UPDATE (SETTINGS PAGE)
    // =========================================================================
    if (!(await isSupabaseMode())) {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const identifier =
        authUser?.email && authUser.email !== 'admin@poultry.local'
          ? authUser.email
          : typeof email === 'string' && email.trim()
            ? email.trim()
            : '';

      if (!identifier) {
        return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
      }

      const user = await findLocalUser(identifier);
      if (!user) {
        return NextResponse.json({ success: true, message: 'If an account matches, the password has been updated.' });
      }

      if (currentPassword) {
        const valid = user.passwordHash ? bcrypt.compareSync(currentPassword, user.passwordHash) : false;
        if (!valid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }

      const ok = await updateLocalPassword(user.id, newPassword);
      if (!ok) {
        return NextResponse.json({ error: 'Failed to update password in database' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully!' });
    }

    // ---- Supabase mode authenticated update ----
    if (authUser && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      if (currentPassword) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword
        });
        if (verifyErr) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }

      const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      const { error: updateErr } = await supabase
        .from('users')
        .update({ passwordHash })
        .eq('id', authUser.id);

      if (updateErr) {
        return NextResponse.json({ error: 'Failed to update password in database' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully!'
      });
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to process password reset' }, { status: 500 });
  }
}