import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup', '/onboarding', '/room'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Add slug pattern check:
  if (pathname.match(/^\/[a-z0-9.-]+$/) && !pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = req.cookies.get('session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};