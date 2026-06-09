import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup', '/onboarding', '/room'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Check session cookie
  // const session = req.cookies.get('session');
 
  // Check for the local frontend domain cookie flag
  const session = req.cookies.get('local_session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};