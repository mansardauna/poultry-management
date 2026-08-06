import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname
  const { data: { user } } = await supabase.auth.getUser()

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
    '/reset-password'
  ];

  const isPublicPath = 
    publicPaths.includes(path) || 
    path.startsWith('/api/') || 
    path.startsWith('/pay-invoice') || 
    path.includes('.');

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    supabaseResponse.headers.set('x-user-role', user.user_metadata?.role || 'Admin')
    supabaseResponse.headers.set('x-user-email', user.email || '')
    
    // Read organization details from cookies (set during login/signup)
    const tier = request.cookies.get('pfms_tier')?.value || 'free'
    const orgId = request.cookies.get('pfms_org_id')?.value || ''
    supabaseResponse.headers.set('x-user-tier', tier)
    supabaseResponse.headers.set('x-org-id', orgId)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}
