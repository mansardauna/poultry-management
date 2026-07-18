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

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 },
    );
  }

  try {
    // Authenticate user
    const { data: foundUsers } = await supabase.from('users').select('*').eq('username', username).limit(1);
    const user = foundUsers?.[0];

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 },
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only-please-change');
    const token = await new SignJWT({ role: user.role, username: user.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({ ok: true, role: user.role });
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
  } catch (error) {
    console.error('Login Database Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while communicating with the database.' },
      { status: 500 }
    );
  }
}
