'use strict';

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true, redirect: '/setup/login' });
  response.cookies.set('pfms_setup_auth', '', { maxAge: 0, path: '/' });
  return response;
}
