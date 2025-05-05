
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose'; // Using 'jose' for JWT verification
import { userClientDataSchema, type UserClientData, type Session } from '@/lib/definitions'; // Import user schema and Session type

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'session'; // Name of the cookie storing the JWT

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}

// Convert the secret string to a Uint8Array for jose
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Retrieves the current session from the request cookie.
 * @returns {Promise<Session | null>} The session object or null if no valid session exists.
 */
export async function getSession(): Promise<Session | null> {
  const sessionCookie = cookies().get(COOKIE_NAME)?.value;

  if (!sessionCookie) {
    console.log('[getSession] No session cookie found.');
    return null;
  }

  try {
    // Verify the JWT using jose
    const { payload } = await jwtVerify(sessionCookie, secretKey, {
      algorithms: ['HS256'], // Specify the expected algorithm
    });

    // Validate the payload structure against the userClientDataSchema
    // The payload from jwtVerify contains standard claims like 'exp', 'iat', etc.
    // We expect our custom data (userId, email) to be nested or directly present.
    // Assuming the payload structure matches UserClientData directly:
    const validatedPayload = userClientDataSchema.safeParse(payload);

    if (!validatedPayload.success) {
        console.error('[getSession] JWT payload validation failed:', validatedPayload.error.flatten());
        return null;
    }

    // Calculate expiration time (payload.exp is in seconds since epoch)
    const expires = payload.exp ? new Date(payload.exp * 1000).toISOString() : new Date(0).toISOString(); // Default to epoch if exp is missing

     console.log(`[getSession] Session verified for user: ${validatedPayload.data.email}, Expires: ${expires}`);

    // Construct the Session object
    return {
      user: validatedPayload.data, // Contains { userId, email }
      expires: expires,
    };

  } catch (error: any) {
     if (error.code === 'ERR_JWT_EXPIRED') {
         console.log('[getSession] Session cookie expired.');
     } else if (error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
         console.error('[getSession] Invalid session cookie signature or format.');
     } else {
         console.error('[getSession] Error verifying session cookie:', error);
     }
    // Clear the invalid/expired cookie
    cookies().delete(COOKIE_NAME);
    return null;
  }
}

/**
 * Verifies the current session and returns the user data.
 * Throws an error if authentication fails.
 * @returns {Promise<UserClientData>} The authenticated user's data.
 * @throws {Error} If authentication fails (no session, invalid session, expired session).
 */
export async function verifyAuth(): Promise<UserClientData> {
  const session = await getSession();

  if (!session?.user) {
     console.warn('[verifyAuth] Authentication failed: No valid session user found.');
    throw new Error('Authentication Required: No valid session found.');
  }

  // Additional check: Ensure session hasn't expired based on the 'expires' field
  // Although jwtVerify handles expiration, this adds an extra layer.
  if (new Date(session.expires) <= new Date()) {
     console.warn('[verifyAuth] Authentication failed: Session expired.');
     // Clear the expired cookie server-side
     cookies().delete(COOKIE_NAME);
     throw new Error('Authentication Required: Session has expired.');
  }

   console.log(`[verifyAuth] Authentication successful for user: ${session.user.email}`);
  return session.user; // Return { userId, email }
}


/**
 * Utility function to get the authentication status (session object).
 * Useful for server components to conditionally render UI based on login state.
 * Does not throw errors, simply returns the session or null.
 * @returns {Promise<{ session: Session | null }>} Object containing the session or null.
 */
export async function getUserAuth(): Promise<{ session: Session | null }> {
    const session = await getSession();
    return { session };
}
