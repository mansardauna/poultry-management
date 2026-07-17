'use strict';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/drizzle';
import { schema } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = typeof body?.role === 'string' ? body.role : '';

  if (!username || !password || !role) {
    return NextResponse.json(
      { error: 'Username, password, and role are required' },
      { status: 400 },
    );
  }

  if (!['Admin', 'Manager', 'Staff'].includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role selected' },
      { status: 400 },
    );
  }

  try {
    // Check if user already exists
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 },
      );
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    await db.insert(schema.users).values({
      id: `usr_${Date.now()}`,
      username: username,
      passwordHash: passwordHash,
      role: role,
      createdAt: new Date().toISOString(),
    });

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
      { error: `Internal server error: ${error.message} | Code: ${error.code} | Detail: ${error.detail} | Hint: ${error.hint}` },
      { status: 500 }
    );
  }
}
