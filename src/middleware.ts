
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define paths that require authentication
const protectedRoutes = ['/dashboard', '/save-seed']; // Added /save-seed

// Define paths that should redirect logged-in users away
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Check if the current path is an auth route (login/signup)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // --- Rule 1: Protect protected routes ---
  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    console.log(`[Middleware] No token found for protected route: ${pathname}. Redirecting to /login.`);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Add a message and redirect param so user can be sent back after login
    url.searchParams.set('message', 'Please log in to access this page.');
    url.searchParams.set('redirect', pathname); // Pass the original path
    return NextResponse.redirect(url);
  }

   // --- Rule 2: Redirect logged-in users from auth routes ---
   // If logged in (has token) and trying to access login/signup, redirect to dashboard
   if (token && isAuthRoute) {
     console.log(`[Middleware] Logged-in user accessing auth route ${pathname}. Redirecting to /dashboard.`);
     const url = request.nextUrl.clone();
     url.pathname = '/dashboard';
     url.search = ''; // Clear any existing search params like 'message' or 'redirect'
     return NextResponse.redirect(url);
   }

  // --- Rule 3: Allow access ---
  // Continue to the requested page if none of the above conditions met
  // (e.g., accessing public route, or accessing protected route while logged in)
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
     * - / (the root path, handled separately if needed) - Let's include it to handle redirects
     * - /images (public images)
     * - sw.js (service worker)
     *
     * We want middleware to run on:
     * - /dashboard/*
     * - /save-seed
     * - /login
     * - /signup
     * - potentially / (homepage) if we add logic for it
     */
     // Match root and specific pages/folders
     '/',
     '/dashboard/:path*',
     '/save-seed',
     '/login',
     '/signup',
    // Exclude API, static assets etc. using negative lookahead if needed,
    // but explicit matching is often clearer.
    // '/((?!api|_next/static|_next/image|favicon.ico|images|sw.js).*)',
  ],
}
