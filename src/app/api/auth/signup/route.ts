'use strict';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = 'Admin';

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 },
    );
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.from('users').select('*').eq('username', username).limit(1);
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 },
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const { error: insertError } = await supabase.from('users').insert([{
      id: `usr_${Date.now()}`,
      username: username,
      passwordHash: passwordHash,
      role: role,
      createdAt: new Date().toISOString(),
    }]);

    if (insertError) {
      console.error('Insert Error:', insertError);
      return NextResponse.json(
        { error: `Database blocked signup. Ensure RLS is disabled on the users table. Details: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Auto-login after signup
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only-please-change');
    const token = await new SignJWT({ role: role, username: username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({ ok: true, role: role });
    response.cookies.set({
      name: 'pfms_auth',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Signup Database Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
