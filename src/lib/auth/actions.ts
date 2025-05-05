
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { LoginSchema, SignupSchema, userClientDataSchema } from '@/lib/definitions'; // Import schemas
import type { LoginFormData, SignupFormData, UserClientData } from '@/lib/definitions';

// Use the standard backend URL variable, assuming it's set in the environment for the Next.js server process
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'session'; // Cookie name consistent with utils

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}
if (!BACKEND_API_URL) {
    console.warn('Warning: BACKEND_API_URL environment variable is not defined. Using default http://localhost:3001');
}


// Helper function to set the session cookie
async function setSessionCookie(token: string) {
    // Decode the token *without* verification just to get the expiration time
    // IMPORTANT: Never trust the payload without verification for authorization
    // We rely on the backend verification for security. Here we just need 'exp'.
    let expires: Date | undefined;
    try {
        const { default: jwtDecode } = await import('jwt-decode'); // Dynamically import jwt-decode
        const decoded: { exp?: number } = jwtDecode(token);
        if (decoded.exp) {
            expires = new Date(decoded.exp * 1000);
        } else {
             console.warn('[Auth Actions] JWT token does not contain an expiration claim.');
             // Set a default short expiration if none found? Or handle error?
             // Setting a fallback of 1 hour for now
             expires = new Date(Date.now() + 60 * 60 * 1000);
        }
    } catch (error) {
        console.error('[Auth Actions] Error decoding JWT for expiration:', error);
         // Fallback expiration if decoding fails
         expires = new Date(Date.now() + 60 * 60 * 1000);
    }

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true, // Prevent client-side JS access
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    // maxAge: calculated from token expiration? Or use backend's duration?
    // Setting maxAge based on decoded 'exp'
    maxAge: expires ? Math.floor((expires.getTime() - Date.now()) / 1000) : undefined, // maxAge in seconds
    expires: expires, // Set expires attribute
    path: '/', // Cookie available for all paths
    sameSite: 'lax', // Mitigate CSRF attacks
  });
   console.log(`[Auth Actions] Session cookie set. Expires: ${expires?.toISOString()}`);
}

// --- Login Action ---
export async function handleLogin(
  formData: LoginFormData
): Promise<{ success: boolean; error?: string }> {
  // Validate form data
  const validatedFields = LoginSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[Login Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid email or password.' };
  }

  const { email, password } = validatedFields.data;

  try {
    console.log(`[Login Action] Sending login request for email: ${email} to ${BACKEND_API_URL}/api/auth/login`);
    const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
       console.warn(`[Login Action] Backend login failed for ${email}:`, { status: response.status, data });
      return { success: false, error: data.message || `Login failed (status: ${response.status})` };
    }

    // Assuming the backend returns a token on successful login
    if (data.token) {
        console.log(`[Login Action] Login successful for ${email}. Setting session cookie.`);
        await setSessionCookie(data.token); // Set the session cookie
        return { success: true }; // Indicate success for redirection
    } else {
        console.error(`[Login Action] Backend response missing token for ${email}.`);
        return { success: false, error: 'Login failed: No session token received.' };
    }
  } catch (error) {
    console.error('[Login Action] Network or unexpected error:', error);
    // Check if it's a fetch error (e.g., connection refused)
    let detailedError = 'An unknown error occurred.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
        detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
    } else if (error instanceof Error) {
        detailedError = error.message;
    }
    return { success: false, error: `Login failed: ${detailedError}` };
  }
}

// --- Signup Action ---
export async function handleSignup(
  formData: SignupFormData
): Promise<{ success: boolean; error?: string }> {
  // Validate form data
  const validatedFields = SignupSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[Signup Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
     const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid signup data.' };
  }

  const { email, password } = validatedFields.data;

  try {
     console.log(`[Signup Action] Sending signup request for email: ${email} to ${BACKEND_API_URL}/api/auth/signup`);
    const response = await fetch(`${BACKEND_API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.warn(`[Signup Action] Backend signup failed for ${email}:`, { status: response.status, data });
        return { success: false, error: data.message || `Signup failed (status: ${response.status})` };
    }

     console.log(`[Signup Action] Signup successful for ${email}.`);
    // Optionally auto-login after signup? For now, just return success.
    // If auto-login: call handleLogin or backend should return token here.
    return { success: true }; // Indicate success (user needs to login separately for now)

  } catch (error) {
    console.error('[Signup Action] Network or unexpected error:', error);
    // Check if it's a fetch error (e.g., connection refused)
     let detailedError = 'An unknown error occurred.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) {
         detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
     } else if (error instanceof Error) {
         detailedError = error.message;
     }
    return { success: false, error: `Signup failed: ${detailedError}` };
  }
}

// --- Sign Out Action ---
export async function handleSignOut(): Promise<void> {
  console.log('[Sign Out Action] Clearing session cookie.');
  // Delete the session cookie
  cookies().delete(COOKIE_NAME);
  // No need to call backend unless you want to invalidate the token server-side (more complex setup)

  // Redirect is handled by the component calling this action
}

// --- Delete Account Action ---
// This action initiates the account deletion process on the backend
export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
    const sessionCookie = cookies().get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
        return { success: false, error: 'Not authenticated. Cannot delete account.' };
    }

    try {
        console.warn(`[Delete Account Action] Sending request to delete account to ${BACKEND_API_URL}/api/users/profile`);
        const response = await fetch(`${BACKEND_API_URL}/api/users/profile`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionCookie}`, // Send the token for authentication
            },
        });

        const data = await response.json();

        if (!response.ok) {
             console.error('[Delete Account Action] Backend deletion failed:', { status: response.status, data });
            return { success: false, error: data.message || `Failed to delete account (status: ${response.status})` };
        }

        console.log('[Delete Account Action] Account deletion successful on backend.');
        // Sign out locally after successful backend deletion
        await handleSignOut();
        return { success: true };

    } catch (error) {
        console.error('[Delete Account Action] Network or unexpected error:', error);
        let detailedError = 'An unknown error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { success: false, error: `Failed to delete account: ${detailedError}` };
    }
}
