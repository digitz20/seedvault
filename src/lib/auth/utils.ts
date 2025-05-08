'use server'; // Ensure this runs on the server

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose'; // Using 'jose' for JWT verification
import { userClientDataSchema, type UserClientData, type Session } from '@/lib/definitions'; // Import user schema and Session type

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'session'; // Name of the cookie storing the JWT

// Convert the secret string to a Uint8Array for jose early on
let secretKey: Uint8Array;
if (!JWT_SECRET) {
  console.error('[getSecretKey] FATAL ERROR: JWT_SECRET environment variable is not defined.');
  // Use empty key if missing, verification will fail safely
  secretKey = new TextEncoder().encode('');
} else {
  // console.log('[getSecretKey] JWT_SECRET found, encoding key.'); // Reduce noise
  secretKey = new TextEncoder().encode(JWT_SECRET);
}

/**
 * Retrieves the current session from the request cookie.
 * Returns null if the cookie is missing, invalid, expired, or fails validation.
 * Includes detailed logging for debugging authentication issues.
 * @returns {Promise<Session | null>} The session object or null.
 */
export async function getSession(): Promise<Session | null> {
  console.log('\n--- [getSession] Start ---');
  console.time('[getSession] Total Duration');
  const sessionCookie = cookies().get(COOKIE_NAME)?.value;

  if (!sessionCookie) {
    console.log('[getSession] No session cookie found.');
    console.timeEnd('[getSession] Total Duration');
    console.log('--- [getSession] End (Failure: No Cookie) ---\n');
    return null;
  }
  console.log(`[getSession] Found session cookie prefix: ${sessionCookie.substring(0, 10)}...`);

  if (!JWT_SECRET || secretKey.length === 0) { // Check if secret is actually usable
    console.error('[getSession] Cannot verify session: JWT_SECRET is not configured or invalid.');
    console.log('[getSession] Deleting potentially unverified session cookie.');
    cookies().delete(COOKIE_NAME);
    console.timeEnd('[getSession] Total Duration');
    console.log('--- [getSession] End (Failure: No Secret) ---\n');
    return null;
  }

  try {
    console.log('[getSession] Attempting JWT verification...');
    console.time('[getSession] jwtVerify');
    const { payload } = await jwtVerify(sessionCookie, secretKey, {
      algorithms: ['HS256'], // Specify expected algorithm
    });
    console.timeEnd('[getSession] jwtVerify');
    console.log('[getSession] JWT verification successful.');
    // **Log the exact payload received AFTER verification**
    console.log('[getSession] Raw Payload Received After Verification:', JSON.stringify(payload, null, 2));

    // --- CRITICAL VALIDATION ---
    console.log('[getSession] Validating payload structure against userClientDataSchema...');
    console.log('[getSession] Expected Schema: { userId: string, email: string }');
    console.time('[getSession] Zod Validation');
    const validatedPayload = userClientDataSchema.safeParse(payload);
    console.timeEnd('[getSession] Zod Validation');

    if (!validatedPayload.success) {
        console.error('[getSession] CRITICAL: JWT payload validation FAILED.');
        console.error('[getSession] Validation Errors:', JSON.stringify(validatedPayload.error.flatten(), null, 2));
        console.error('[getSession] Raw payload causing failure:', JSON.stringify(payload, null, 2));
        console.log('[getSession] Deleting invalid session cookie due to payload validation failure.');
        cookies().delete(COOKIE_NAME);
        console.timeEnd('[getSession] Total Duration');
        console.log('--- [getSession] End (Failure: Validation) ---\n');
        return null;
    }
    console.log('[getSession] Payload validation successful.');
    const validUserData: UserClientData = validatedPayload.data;
    // --- END VALIDATION ---

    // Check expiration using the 'exp' claim from the verified payload
    let expires: Date;
    if (payload.exp && typeof payload.exp === 'number') {
      expires = new Date(payload.exp * 1000);
    } else {
      console.warn("[getSession] Token payload is missing or has an invalid 'exp' claim. Treating as invalid.");
       cookies().delete(COOKIE_NAME);
       console.timeEnd('[getSession] Total Duration');
       console.log('--- [getSession] End (Failure: Missing/Invalid Exp) ---\n');
      return null;
    }

    const expirationISO = expires.toISOString();
    console.log(`[getSession] Token expiration timestamp: ${expirationISO}`);

    // Check if expired (jwtVerify should catch this, but double-check)
    if (expires.getTime() <= Date.now()) {
        console.warn(`[getSession] Token expired at ${expirationISO}. Deleting cookie.`);
        cookies().delete(COOKIE_NAME);
        console.timeEnd('[getSession] Total Duration');
        console.log('--- [getSession] End (Failure: Expired) ---\n');
        return null;
    }

    console.log(`[getSession] Session validated successfully for user: ${validUserData.email} (ID: ${validUserData.userId}). Expires: ${expirationISO}`);

    const sessionData: Session = {
      user: validUserData,
      expires: expirationISO,
    };
    console.timeEnd('[getSession] Total Duration');
    console.log('--- [getSession] End (Success) ---\n');
    return sessionData;

  } catch (error: any) {
     console.error('[getSession] CRITICAL: Error during JWT verification process.');
     if (error.code === 'ERR_JWT_EXPIRED') {
         console.error('[getSession] Reason: Token expired.');
          // Log details if possible (might fail if cookie is malformed)
          try {
              const decodedPayload = JSON.parse(Buffer.from(sessionCookie.split('.')[1], 'base64').toString());
              const expTime = decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toISOString() : 'N/A';
              console.error(`[getSession] Expired token had 'exp': ${expTime}`);
          } catch (decodeError) {
              console.error('[getSession] Could not decode expired token payload for inspection.');
          }
     } else if (error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
         console.error('[getSession] Reason: Invalid signature or format. CHECK JWT_SECRET.');
     } else if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
         console.error('[getSession] Reason: Claim validation failed (e.g., nbf, aud, iss). Details:', error.message);
     } else {
         console.error('[getSession] Reason: Unexpected error:', error.message || error);
         console.error('[getSession] Error Code:', error.code);
     }
    console.log('[getSession] Deleting potentially invalid/expired session cookie due to error.');
    cookies().delete(COOKIE_NAME); // Ensure cookie is cleared on any error
    console.timeEnd('[getSession] Total Duration');
     console.log('--- [getSession] End (Failure: Catch Block) ---\n');
    return null; // Return null on error
  }
}

/**
 * Verifies the current session and returns the user data.
 * Throws an error if authentication fails (no session, invalid session, expired session).
 * @returns {Promise<UserClientData>} The authenticated user's data.
 * @throws {Error} If authentication fails (no session, invalid session, expired session).
 */
export async function verifyAuth(): Promise<UserClientData> {
  console.log('[verifyAuth] Verifying authentication...');
  const session = await getSession();

  if (!session?.user) {
     console.warn('[verifyAuth] Authentication check failed: getSession() returned null or no user data.');
    throw new Error('Authentication Required'); // Standard error message
  }

  console.log(`[verifyAuth] Authentication successful for user: ${session.user.email}`);
  return session.user;
}


/**
 * Utility function to get the authentication status (session object).
 * Useful for server components to conditionally render UI based on login state.
 * Does not throw errors, simply returns the session or null.
 * @returns {Promise<{ session: Session | null }>} Object containing the session or null.
 */
export async function getUserAuth(): Promise<{ session: Session | null }> {
    // console.log('[getUserAuth] Checking session status...'); // Keep logs minimal unless debugging
    const session = await getSession();
    // if (session) {
    //     console.log(`[getUserAuth] Session found for user: ${session.user.email}`);
    // } else {
    //      console.log('[getUserAuth] No session found.');
    // }
    return { session };
}

/**
 * Sets the session cookie with the provided JWT token.
 * Marked as async to satisfy Server Action requirements.
 * @param token The JWT token string.
 */
export async function setSessionCookie(token: string): Promise<void> { // Added async and Promise<void>
  console.log('[setSessionCookie] Attempting to set session cookie...');
  try {
   const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Use JWT expiration if available, otherwise default (e.g., 30 days)
    // Note: maxAge is in seconds
    maxAge: 30 * 24 * 60 * 60, // Default 30 days
    path: '/',
    sameSite: 'lax' as const,
   };

   console.log('[setSessionCookie] Setting cookie:', COOKIE_NAME, 'with options:', options);
   cookies().set(COOKIE_NAME, token, options);

   // *** Verify cookie was set (for debugging) ***
   const testCookie = cookies().get(COOKIE_NAME);
   console.log('[setSessionCookie] Cookie value after set (prefix):', testCookie?.value?.substring(0, 10) + '...');
   if (!testCookie) {
    console.error('[setSessionCookie] CRITICAL: Immediate cookie check FAILED after setting!');
   } else {
    console.log('[setSessionCookie] Cookie appears to be set successfully.');
   }

  } catch (error) {
   console.error('[setSessionCookie] Error setting session cookie:', error);
  }
}

/**
 * Clears the session cookie.
 * Marked as async to satisfy Server Action requirements.
 */
export async function clearSessionCookie(): Promise<void> { // Keep async
  console.log('[clearSessionCookie] Clearing session cookie:', COOKIE_NAME);
  try {
      cookies().delete(COOKIE_NAME);
      console.log('[clearSessionCookie] Session cookie cleared successfully.');
  } catch (error) {
      console.error('[clearSessionCookie] Error clearing session cookie:', error);
  }
}
