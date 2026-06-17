'use strict';
import { NextResponse } from 'next/server';

/** Exported function POST */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'pfms_auth',
    value: '',
    maxAge: 0,
    path: '/',
  });
  return response;
}
