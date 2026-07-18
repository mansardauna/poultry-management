'use strict';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only-please-change');

export interface AuthUser {
  username: string;
  role: string;
  createdBy?: string | null;
}

/**
 * Get the authenticated user from the pfms_auth cookie.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pfms_auth')?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    return {
      username: payload.username as string,
      role: payload.role as string,
      createdBy: (payload.createdBy as string) || null,
    };
  } catch (err) {
    console.error('JWT Verification Error:', err);
    return null;
  }
}
