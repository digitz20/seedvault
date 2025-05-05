
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Removed: import { ObjectId } from 'mongodb';
// Removed: import { getUsersCollection } from './lib/mongodb'; // No direct DB access

// --- Authentication Check (Simplified) ---
// Checks for the presence of the auth_token cookie.
// In a real app, you might want to verify the token's validity against the backend
// on crucial requests or periodically, but for basic route protection,
// checking cookie existence is often sufficient.
async function hasAuthCookie(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth_token')?.value;
  console.log('[Middleware] Checking auth_token cookie presence:', !!token);
  return !!token;
}
// --------------------------------

// List of routes that require authentication
const protectedRoutes = ['/dashboard', '/save-seed'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const authenticated = await hasAuthCookie(request);

    if (!authenticated) {
      // Redirect to login page if no auth cookie
      console.log(`[Middleware] User missing auth token for protected route: ${pathname}. Redirecting to /login.`);
      const loginUrl = new URL('/login', request.url);
      // Optionally add a 'redirectedFrom' query parameter
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      const response = NextResponse.redirect(loginUrl);
      // No need to clear the cookie here as we are checking its presence
      return response;
    }
    console.log(`[Middleware] User has auth token for protected route: ${pathname}. Allowing access.`);
  }

  // Allow the request to proceed if it's not a protected route
  // or if the user has an auth token for a protected route.
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - if you have Next.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root route - assuming it's public)
     * - /login (the login page itself)
     * - /signup (the signup page itself)
     */
    // Adjusted matcher to only include protected routes explicitly
    '/dashboard/:path*',
    '/save-seed/:path*',
    // The previous negative lookahead might have been too broad.
    // '/((?!api|_next/static|_next/image|favicon.ico|login|signup|$).*)',
  ],
};
