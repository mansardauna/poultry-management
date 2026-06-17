'use strict';
import { NextResponse } from 'next/server';

type AuthRole = 'Admin' | 'Manager' | 'Staff';

type AuthUser = {
  username: string;
  password: string;
  role: AuthRole;
};

const authUsers: AuthUser[] = [
  {
    role: 'Admin',
    username: process.env.PFMS_ADMIN_USERNAME ?? 'owner',
    password: process.env.PFMS_ADMIN_PASSWORD ?? 'PoultryFarm@2026!',
  },
  {
    role: 'Manager',
    username: process.env.PFMS_MANAGER_USERNAME ?? 'manager',
    password: process.env.PFMS_MANAGER_PASSWORD ?? 'Manager@2026!',
  },
  {
    role: 'Staff',
    username: process.env.PFMS_STAFF_USERNAME ?? 'staff',
    password: process.env.PFMS_STAFF_PASSWORD ?? 'Staff@2026!',
  },
];

function findUser(username: string) {
  return authUsers.find(
    (user) => user.username.toLowerCase() === username.toLowerCase(),
  );
}

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

  const user = findUser(username);

  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set({
    name: 'pfms_auth',
    value: user.role,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return response;
}
