import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- Mock Authentication Check ---
// In a real app, verify the session cookie/token using your auth library
// (e.g., next-auth, iron-session) or JWT verification logic.
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionId = request.cookies.get('session_id')?.value;
  console.log('[Middleware] Checking session cookie:', sessionId);

  // Basic check: Does the cookie exist?
  // Replace this with actual session validation against a backend store or JWT verification.
  const isValidSession = !!sessionId && sessionId.startsWith('mock-session-');

  console.log('[Middleware] Is session valid (mock check)?', isValidSession);
  return isValidSession;
}
// --------------------------------

// List of routes that require authentication
const protectedRoutes = ['/dashboard', '/save-seed'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    const authenticated = await isAuthenticated(request);

    if (!authenticated) {
      // Redirect to login page if not authenticated
      console.log(`[Middleware] User not authenticated for protected route: ${pathname}. Redirecting to /login.`);
      const loginUrl = new URL('/login', request.url);
      // Optionally add a 'redirectedFrom' query parameter
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    console.log(`[Middleware] User authenticated for protected route: ${pathname}. Allowing access.`);
  }

  // Allow the request to proceed if it's not a protected route
  // or if the user is authenticated for a protected route.
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root route - assuming it's public)
     * - /login (the login page itself)
     * - /signup (the signup page itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|$).*)',
    // Explicitly include protected routes if the negative lookahead is too complex
     '/dashboard/:path*',
     '/save-seed/:path*',
  ],
};
