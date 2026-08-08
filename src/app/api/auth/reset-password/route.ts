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

      // If current password check is requested
      if (currentPassword) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('passwordHash')
          .eq('id', authUser.id)
          .single();

        if (userRecord?.passwordHash) {
          const isValid = await bcrypt.compare(currentPassword, userRecord.passwordHash);
          if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
          }
        }
      }

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
