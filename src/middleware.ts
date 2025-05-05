
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that were previously protected or auth-related (for reference, but unused)
// const protectedRoutes = ['/dashboard', '/save-seed'];
// const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  // No authentication checks needed anymore.
  // All requests are allowed to proceed.
  console.log(`[Middleware] Allowing request to: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

// Specify the paths the middleware should run on.
// This config can be simplified or removed if middleware does nothing.
// Keeping it for potential future use.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - sw.js (service worker)
     */
     // Apply middleware to all pages for potential future use, excluding assets/API
     '/((?!api|_next/static|_next/image|favicon.ico|images|sw.js).*)',
  ],
}
