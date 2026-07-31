import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { evaluateAdminAccess } from './lib/admin-access';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const decision = evaluateAdminAccess();
    if (!decision.allowed) {
      // Authentication is not configured, redirecting to the main public page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
