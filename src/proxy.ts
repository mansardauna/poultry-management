import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths
  if (path === '/login' || path.startsWith('/api/') || path.includes('.')) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('pfms_auth');

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
