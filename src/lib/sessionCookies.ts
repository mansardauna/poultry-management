'use strict';

import { NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE_NAME, type SessionPayload } from './session';

/**
 * Display-only cookies readable by client-side JS (Sidebar/Header UI hints).
 * These are NEVER trusted for authorization: the proxy rewrites them on every
 * request from the verified, signed `pfms_session` cookie.
 */
export const UI_COOKIE_NAMES = [
  'pfms_role',
  'pfms_email',
  'pfms_name',
  'pfms_tier',
  'pfms_org_id',
  'pfms_user_id',
  'pfms_impersonate_by',
  'pfms_impersonate_org_name',
] as const;

function isSecureRequest(request?: Request): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true;
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (!request) return false;
  const proto = request.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  try {
    return new URL(request.url).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Issue a signed session cookie (httpOnly) plus display-only UI cookies on a response.
 */
export async function attachSession(
  response: NextResponse,
  payload: SessionPayload,
  options: { maxAge?: number; request?: Request } = {}
): Promise<NextResponse> {
  const maxAge = options.maxAge ?? 60 * 60 * 24;
  const secure = isSecureRequest(options.request);
  const token = await signSession(payload, maxAge);

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    maxAge,
    httpOnly: true,
    sameSite: 'lax',
    secure,
  });

  const ui = { path: '/', maxAge, sameSite: 'lax' as const, secure };
  response.cookies.set('pfms_role', payload.role, ui);
  response.cookies.set('pfms_email', payload.email || '', ui);
  response.cookies.set('pfms_name', payload.name || '', ui);
  response.cookies.set('pfms_tier', payload.tier || 'free', ui);
  response.cookies.set('pfms_org_id', payload.orgId || '', ui);
  response.cookies.set('pfms_user_id', payload.userId, ui);
  response.cookies.set('pfms_workspace', payload.workspaceId || '', ui);

  if (payload.impersonatedBy) {
    response.cookies.set('pfms_impersonate_by', 'superadmin', ui);
    response.cookies.set('pfms_impersonate_org_name', payload.impersonatedOrgName || '', ui);
  } else {
    response.cookies.set('pfms_impersonate_by', '', { path: '/', maxAge: 0 });
    response.cookies.set('pfms_impersonate_org_name', '', { path: '/', maxAge: 0 });
  }

  return response;
}

/**
 * Clear the session and all auth-related UI cookies.
 */
export function clearSession(response: NextResponse): NextResponse {
  const expire = { path: '/', maxAge: 0 };
  response.cookies.set(SESSION_COOKIE_NAME, '', expire);
  for (const name of UI_COOKIE_NAMES) response.cookies.set(name, '', expire);
  response.cookies.set('pfms_workspace', '', expire);
  return response;
}

/** Extract an org id (org_xxx) from a workspace id like `main-org_123`. */
export function orgIdFromWorkspace(workspaceId?: string | null): string {
  if (!workspaceId) return '';
  const match = workspaceId.match(/org_[a-zA-Z0-9]+/);
  return match ? match[0] : '';
}
