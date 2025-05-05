
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/utils'; // Import getSession to check auth status

// Define paths that require authentication
const protectedRoutes = ['/dashboard', '/save-seed'];
// Define authentication paths (login, signup)
const authRoutes = ['/login', '/signup'];
// Public paths (everyone can access)
const publicPaths = ['/']; // Add other public paths like /about if needed

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Check Authentication Status
  const session = await getSession(); // Check for a valid session cookie
  const isAuthenticated = !!session?.user; // True if user object exists in session

   console.log(`[Middleware] Path: ${pathname}, Authenticated: ${isAuthenticated}`);

  // 2. Handle Protected Routes
  if (protectedRoutes.some(path => pathname.startsWith(path))) {
    if (!isAuthenticated) {
       console.log(`[Middleware] Denied access to ${pathname} (unauthenticated). Redirecting to login.`);
      // Redirect unauthenticated users trying to access protected routes to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('message', 'Please log in to access this page.');
      return NextResponse.redirect(loginUrl);
    }
     // If authenticated, allow access to protected route
     console.log(`[Middleware] Allowed access to protected route: ${pathname}`);
     return NextResponse.next();
  }

  // 3. Handle Authentication Routes (Login/Signup)
  if (authRoutes.some(path => pathname.startsWith(path))) {
    if (isAuthenticated) {
       console.log(`[Middleware] Authenticated user accessing ${pathname}. Redirecting to dashboard.`);
      // Redirect authenticated users trying to access login/signup back to the dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
     // If not authenticated, allow access to login/signup page
     console.log(`[Middleware] Allowed access to auth route: ${pathname}`);
     return NextResponse.next();
  }

  // 4. Handle Public Routes (like homepage)
  // Everyone can access public paths, no specific checks needed here unless you have special cases.
  if (publicPaths.includes(pathname)) {
      console.log(`[Middleware] Allowed access to public route: ${pathname}`);
      return NextResponse.next();
  }

  // 5. Default - Allow other paths (e.g., API routes, static files handled by config)
  // console.log(`[Middleware] Allowing access to other path: ${pathname}`);
  return NextResponse.next();
}

// Specify the paths the middleware should run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - Handled by backend auth
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - sw.js (service worker, if any)
     */
     // Apply middleware broadly to pages, let the logic above handle routing rules.
     '/((?!api|_next/static|_next/image|favicon.ico|images|sw.js).*)',
  ],
};
