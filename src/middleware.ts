import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Removed authentication imports
// import { getSession } from '@/lib/auth/utils';

// Authentication logic is disabled. Middleware will now allow all requests to pass through.
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[Middleware - Auth Disabled] Passing through request for path: ${pathname}`);
  return NextResponse.next(); // Allow all requests
}

// Keep the matcher configuration, but the middleware logic above bypasses any checks.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - sw.js (service worker, if any)
     */
     '/((?!api|_next/static|_next/image|favicon.ico|images|sw.js).*)',
  ],
};
