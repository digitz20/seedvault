
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that require authentication
const protectedRoutes = ['/dashboard', '/save-seed']; // Add any other routes that need protection

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If it's a protected route and there's no token, redirect to login
  if (isProtectedRoute && !token) {
    console.log(`[Middleware] No token found for protected route: ${pathname}. Redirecting to /login.`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('message', 'Please log in to access this page.'); // Optional message
    return NextResponse.redirect(url);
  }

   // If the user is logged in (has a token) and tries to access login/signup, redirect to dashboard
   if (token && (pathname === '/login' || pathname === '/signup')) {
     console.log(`[Middleware] Logged-in user accessing ${pathname}. Redirecting to /dashboard.`);
     const url = request.nextUrl.clone();
     url.pathname = '/dashboard';
     return NextResponse.redirect(url);
   }


  // Continue to the requested page if authenticated or if the route is not protected
  return NextResponse.next();
}

// Specify the paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, allowing access to the homepage)
     * - /images (public images)
     * - /login
     * - /signup
     * We want middleware to run on /dashboard and /save-seed, etc.
     * and also on /login, /signup to redirect logged-in users.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|sw.js).*)', // Adjusted to include login/signup
    // Explicitly include routes if the negative lookahead is too broad
    // '/dashboard/:path*',
    // '/save-seed/:path*',
    // '/login',
    // '/signup',
  ],
}
