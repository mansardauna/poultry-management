import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/setup',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/documentation',
    '/reset-password'
  ];

  const isPublicPath =
    publicPaths.includes(path) ||
    path.startsWith('/api/') ||
    path.startsWith('/pay-invoice') ||
    path.includes('.');

  // Local installs (MySQL/PostgreSQL chosen in the wizard) never talk to Supabase.
  const localMode = request.cookies.get('pms_db_mode')?.value === '1'
  const sessionToken = request.cookies.get('pms_session')?.value
  const isLocalSessionValid =
    localMode &&
    typeof sessionToken === 'string' &&
    /^[0-9a-f]{64}$/.test(sessionToken)

  let supabaseResponse: NextResponse | null = null
  let userEmail = ''
  let userRole = 'Admin'

  if (!localMode) {
    supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse!.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const isSuperAdminEmail = user.email === 'superadmin@pfms.com'
      userRole = isSuperAdminEmail || user.user_metadata?.role === 'SuperAdmin' ? 'SuperAdmin' : (user.user_metadata?.role || 'Admin')
      userEmail = user.email || ''
    }
  } else if (isLocalSessionValid) {
    userEmail = request.cookies.get('pms_session_user')?.value || ''
    userRole = request.cookies.get('pfms_role')?.value || 'Admin'
  }

  const isAuthed = Boolean(userEmail)

  if (!isAuthed && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const response = supabaseResponse ?? NextResponse.next({ request })

  if (isAuthed) {
    response.headers.set('x-user-role', userRole)
    response.headers.set('x-user-email', userEmail)

    // Read organization details from cookies (set during login/signup)
    const tier = request.cookies.get('pfms_tier')?.value || 'free'
    const orgId = request.cookies.get('pfms_org_id')?.value || ''
    response.headers.set('x-user-tier', tier)
    response.headers.set('x-org-id', orgId)
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}