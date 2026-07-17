'use strict';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/drizzle';
import { schema } from '@/lib/schema';
import { eq } from 'drizzle-orm';

type AuthRole = 'Admin' | 'Manager' | 'Staff';

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

  // Check if database has any users
  const allUsers = await db.select().from(schema.users).limit(1);
  
  if (allUsers.length === 0) {
    // Smart Initialization: Create the first user as Admin
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    await db.insert(schema.users).values({
      id: `usr_${Date.now()}`,
      username: username,
      passwordHash: passwordHash,
      role: 'Admin',
      createdAt: new Date().toISOString(),
    });
  }

  // Authenticate user
  const foundUsers = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
  const user = foundUsers[0];

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
}
