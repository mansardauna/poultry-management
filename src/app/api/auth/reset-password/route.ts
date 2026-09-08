'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser();
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    // Logged-in user updating password
    if (authUser && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      // Verify the current password against the actual login store (Supabase Auth)
      if (currentPassword) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword
        });
        if (verifyErr) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }

      // Update Supabase Auth password (source of truth for real login)
      const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
      if (authUpdateErr) {
        console.warn('Failed to update Supabase Auth password:', authUpdateErr.message);
      }

      // Keep legacy users-table hash in sync for fallback login paths
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

    // Unauthenticated reset request via email
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${cleanEmail},username.eq.${email.trim()}`)
      .limit(1);

    if (users && users.length > 0) {
      const user = users[0];
      if (newPassword && newPassword.length >= 6) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await supabase
          .from('users')
          .update({ passwordHash })
          .eq('id', user.id);

        // Also update the Supabase Auth password for the matching auth account
        try {
          const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
          const authAccount = authUsers?.find((u) => u.email?.toLowerCase() === cleanEmail);
          if (authAccount?.id) {
            await supabase.auth.admin.updateUserById(authAccount.id, { password: newPassword });
          }
        } catch (listErr) {
          console.warn('Failed to sync Supabase Auth password reset:', listErr);
        }

        return NextResponse.json({
          success: true,
          message: 'Your password has been reset successfully! You can now log in.'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'If an account exists with this email, password reset instructions have been dispatched.' 
    });
  } catch (err: any) {
    console.error('Password Reset API Error:', err);
    return NextResponse.json({ error: 'Failed to process password reset' }, { status: 500 });
  }
}
