import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development-only-please-change');

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths
  if (path === '/' || path === '/login' || path.startsWith('/api/') || path.includes('.')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('pfms_auth')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-username', payload.username as string);
    requestHeaders.set('x-user-created-by', (payload.createdBy as string) || '');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    // Token is invalid or expired
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('pfms_auth');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
};
