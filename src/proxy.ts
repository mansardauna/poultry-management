import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifySession, SESSION_COOKIE_NAME } from './lib/session'

function isValidSupabaseUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('placeholder')) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const PUBLIC_EXACT_PATHS = new Set([
  '/', 
  '/login', 
  '/signup', 
  '/pricing', 
  '/about', 
  '/contact', 
  '/privacy', 
  '/terms', 
  '/documentation', 
  '/reset-password',
  '/setup'
]);

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/2fa',
  '/api/setup',
  '/api/webhooks',
  '/api/pay-invoice',
  '/api/staff/validate',
  '/api/branding',
  '/api/plans',
];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicStatic = path.includes('.') || path.startsWith('/_next');
  const isPublicExact = PUBLIC_EXACT_PATHS.has(path) || path.startsWith('/pay-invoice');
  const isPublicApi = PUBLIC_API_PREFIXES.some(prefix => path.startsWith(prefix)) || ((path === '/api/admin/cms' || path === '/api/admin/plans') && request.method === 'GET');
  const isPublicPath = isPublicStatic || isPublicExact || isPublicApi;

  // 1. Verify Cryptographic JWT Session Cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let verifiedSession = sessionToken ? await verifySession(sessionToken) : null;

  // 2. Secondary Supabase Auth lookup if session token is missing
  let supabaseUser: any = null;
  const supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const isSupabaseValid = isValidSupabaseUrl(url) && Boolean(key && key !== 'placeholder-key');

  if (!verifiedSession && isSupabaseValid) {
    const hasSbCookies = request.cookies.getAll().some(c => c.name.startsWith('sb-') || c.name.includes('auth-token'));
    if (hasSbCookies) {
      try {
        const supabase = createServerClient(url, key, {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        });
        const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 1500)
        );
        const res = await Promise.race([supabase.auth.getUser(), timeoutPromise]);
        supabaseUser = res.data?.user || null;
      } catch {
        supabaseUser = null;
      }
    }
  }

  const isAuthenticated = Boolean(verifiedSession || supabaseUser);
  const userRole = verifiedSession?.role || (supabaseUser ? 'Admin' : '');
  const userEmail = verifiedSession?.email || supabaseUser?.email || '';
  const isSuperAdmin = userRole === 'SuperAdmin';

  // 3. Security Boundary: Protect /api/admin/* routes
  if (path.startsWith('/api/admin')) {
    // exit_impersonate is handled inside tenants route with signed impersonation verification
    const isExitImpersonate = path === '/api/admin/tenants' && request.method === 'POST';
    const isPublicAdminCmsGet = path === '/api/admin/cms' && request.method === 'GET';
    const isPublicAdminPlansGet = path === '/api/admin/plans' && request.method === 'GET';
    if (!isExitImpersonate && !isPublicAdminCmsGet && !isPublicAdminPlansGet) {
      if (!isAuthenticated || !isSuperAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: Super Admin access required.' },
          { status: 403 }
        );
      }
    }
  }

  // 4. Security Boundary: Protect /dashboard/admin pages
  if (path.startsWith('/dashboard/admin')) {
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
    if (!isSuperAdmin) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // 5. Require Authentication for Protected Paths
  if (!isAuthenticated && !isPublicPath) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // 6. Auto-redirect SuperAdmin from general /dashboard to /dashboard/admin
  if (isSuperAdmin && !verifiedSession?.impersonatedBy && (path === '/dashboard' || path === '/dashboard/')) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/dashboard/admin';
    return NextResponse.redirect(adminUrl);
  }

  // 7. Inject verified identity headers for downstream server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-path', path);

  if (isAuthenticated) {
    const tier = isSuperAdmin ? 'enterprise' : (verifiedSession?.tier || 'free');
    const orgId = isSuperAdmin ? 'org_superadmin' : (verifiedSession?.orgId || '');
    const workspaceId = verifiedSession?.workspaceId || '';

    requestHeaders.set('x-user-role', userRole);
    requestHeaders.set('x-user-email', userEmail);
    requestHeaders.set('x-user-tier', tier);
    requestHeaders.set('x-org-id', orgId);
    if (workspaceId) requestHeaders.set('x-workspace-id', workspaceId);

    supabaseResponse.headers.set('x-user-role', userRole);
    supabaseResponse.headers.set('x-user-email', userEmail);
    supabaseResponse.headers.set('x-user-tier', tier);
    supabaseResponse.headers.set('x-org-id', orgId);
  }

  const responseWithHeaders = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  supabaseResponse.cookies.getAll().forEach(c => {
    responseWithHeaders.cookies.set(c.name, c.value);
  });
  supabaseResponse.headers.forEach((val, key) => {
    responseWithHeaders.headers.set(key, val);
  });

  return responseWithHeaders;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}
