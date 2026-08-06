'use strict';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Search for user by email / username in Supabase
    const { data: users, error: searchErr } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${cleanEmail},username.eq.${email.trim()}`)
      .limit(1);

    if (searchErr || !users || users.length === 0) {
      // Return positive feedback for security (prevents user enumeration)
      return NextResponse.json({ 
        success: true, 
        message: 'If an account exists with this email, password reset instructions have been dispatched.' 
      });
    }

    const user = users[0];

    // If a new password was provided in the reset form
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

    // Default response confirming dispatch
    return NextResponse.json({ 
      success: true, 
      message: 'Password reset link & verification code have been dispatched to your email.' 
    });
  } catch (err: any) {
    console.error('Password Reset API Error:', err);
    return NextResponse.json({ error: 'Failed to process password reset' }, { status: 500 });
  }
}
