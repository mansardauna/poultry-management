import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const isSupabaseValid = isValidSupabaseUrl(url) && Boolean(key && key !== 'placeholder-key');

  let user: any = null;

  if (isSupabaseValid) {
    try {
      const supabase = createServerClient(
        url,
        key,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            },
          },
        }
      )
      const res = await supabase.auth.getUser();
      user = res.data?.user || null;
    } catch (_err) {
      user = null;
    }
  }

  const roleCookie = request.cookies.get('pfms_role')?.value;
  const orgIdCookie = request.cookies.get('pfms_org_id')?.value;

  const path = request.nextUrl.pathname
  const publicPaths = [
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
  ];

  const isPublicPath = 
    publicPaths.includes(path) || 
    path.startsWith('/api/') || 
    path.startsWith('/pay-invoice') || 
    path.includes('.');

  const isAuthenticated = Boolean(user || roleCookie);

  if (!isAuthenticated && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  if (user || roleCookie) {
    const email = user?.email || request.cookies.get('pfms_email')?.value || '';
    const isSuperAdmin = email === 'superadmin@pfms.com' || roleCookie === 'SuperAdmin';
    const userRole = isSuperAdmin ? 'SuperAdmin' : (roleCookie || user?.user_metadata?.role || 'Admin');
    
    supabaseResponse.headers.set('x-user-role', userRole)
    supabaseResponse.headers.set('x-user-email', email)
    
    const tier = request.cookies.get('pfms_tier')?.value || 'free'
    const orgId = orgIdCookie || ''
    supabaseResponse.headers.set('x-user-tier', tier)
    supabaseResponse.headers.set('x-org-id', orgId)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}
