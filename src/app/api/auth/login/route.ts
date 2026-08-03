'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

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

  const email = username.includes('@') ? username : `${username}@poultry.local`;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 },
      );
    }

    // Next.js response + Supabase cookies are handled automatically by createServerClient
    return NextResponse.json({ ok: true, role: data.user.user_metadata?.role || 'Admin' });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while communicating with the database.' },
      { status: 500 }
    );
  }
}
