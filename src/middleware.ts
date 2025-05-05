import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from './lib/mongodb'; // Adjust path if needed

// --- Authentication Check ---
// Verifies session cookie and checks if user exists in the database.
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionId = request.cookies.get('session_id')?.value;
  console.log('[Middleware] Checking session cookie:', sessionId);

  if (!sessionId || !sessionId.startsWith('session-')) {
    console.log('[Middleware] Invalid or missing session cookie.');
    return false;
  }

  // Extract userId string from session ID
  const userIdString = sessionId.split('-')[1];
  if (!userIdString) {
      console.warn('[Middleware] Could not extract userId from session:', sessionId);
      return false;
  }

  console.log('[Middleware] Extracted userIdString:', userIdString);

  let userId: ObjectId;
  try {
      userId = new ObjectId(userIdString);
      console.log('[Middleware] Converted to ObjectId:', userId);
  } catch (e) {
      console.error('[Middleware] Invalid userId format in session, cannot convert to ObjectId:', userIdString, e);
      // Optionally clear the invalid cookie here
      // const response = NextResponse.next();
      // response.cookies.delete('session_id');
      // Consider returning the response if deleting cookie, otherwise just return false
      return false;
  }


  // Verify user exists in the database
  try {
      const usersCollection = await getUsersCollection();
      // Use countDocuments for efficiency if you only need existence check
      const userCount = await usersCollection.countDocuments({ _id: userId });
      const userExists = userCount > 0;

      if (userExists) {
          console.log('[Middleware] User ID verified in database.');
          return true;
      } else {
          console.warn('[Middleware] User ID from session not found in database:', userId);
          // Optionally clear the invalid cookie here
           // const response = NextResponse.next();
           // response.cookies.delete('session_id');
           // Consider returning the response if deleting cookie, otherwise just return false
          return false;
      }
  } catch (error) {
      console.error('[Middleware] Database error during authentication check:', error);
      return false; // Assume not authenticated if DB error occurs
  }
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
      const response = NextResponse.redirect(loginUrl);
       // If the session was invalid, ensure the bad cookie is cleared on redirect
      if (!request.cookies.has('session_id') || !(await isAuthenticated(request))) { // Re-check or check flag from isAuthenticated
         response.cookies.delete('session_id');
         console.log('[Middleware] Cleared invalid session cookie on redirect.');
      }
      return response;

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
