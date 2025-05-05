
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { jwtVerify } from 'jose'; // Import jose for verification
// Import all necessary schemas and types
import {
    LoginSchema,
    SignupSchema,
    seedPhraseFormSchema,
    LoginAndSaveSchema, // Import the combined schema
    userClientDataSchema
} from '@/lib/definitions';
import type {
    LoginFormData,
    SignupFormData,
    SeedPhraseFormData,
    LoginAndSaveFormData, // Import the combined type
    UserClientData,
    Session // Import Session type
} from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { verifyAuth } from '@/lib/auth/utils'; // Keep verifyAuth for saveSeedPhraseAction

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'session';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined.');
}
if (!BACKEND_API_URL) {
    console.warn('Warning: BACKEND_API_URL environment variable is not defined. Using default http://localhost:3001');
}

// Helper function to get the secret key as Uint8Array
function getSecretKey(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET environment variable is not defined.');
    }
    return new TextEncoder().encode(secret);
}


// Refactored setSessionCookie using jose
async function setSessionCookie(token: string): Promise<Session | null> {
    console.log('[setSessionCookie] Attempting to verify token and set session cookie...');
    try {
        console.log('[setSessionCookie] Verifying JWT token...');
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256'], // Specify expected algorithm
        });
        console.log('[setSessionCookie] JWT verified successfully. Payload:', payload);

        // Validate the payload structure
        // Ensure payload has userId (mongo ObjectId as string) and email
         const expectedPayloadShape = z.object({
           userId: z.string().min(1), // MongoDB ObjectId is typically a 24-char hex string
           email: z.string().email(),
           iat: z.number().optional(), // Issued at (standard JWT claim)
           exp: z.number().optional(), // Expiration time (standard JWT claim)
         });

        console.log('[setSessionCookie] Validating payload against expected shape...');
        const validatedPayload = expectedPayloadShape.safeParse(payload);

        if (!validatedPayload.success) {
            console.error('[setSessionCookie] JWT payload validation FAILED:', validatedPayload.error.flatten());
            throw new Error('Invalid user data structure in token payload.');
        }
         console.log('[setSessionCookie] Payload validation SUCCEEDED.');

        const validUserData: UserClientData = {
             userId: validatedPayload.data.userId,
             email: validatedPayload.data.email,
         };

        // Calculate expiration time from payload.exp (seconds)
        const expires = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 60 * 60 * 1000); // Fallback 1 hour
        console.log(`[setSessionCookie] Expiration determined: ${expires.toISOString()}`);

        // Set the cookie
        console.log(`[setSessionCookie] Attempting to set cookie '${COOKIE_NAME}' for user ${validUserData.email}`);
        cookies().set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: expires,
            path: '/',
            sameSite: 'lax',
        });
        console.log('[setSessionCookie] Cookie set command executed.');

        const sessionData: Session = {
            user: validUserData,
            expires: expires.toISOString(),
        };

        console.log(`[setSessionCookie] Session object created successfully for ${sessionData.user.email}. Expires: ${sessionData.expires}`);
        return sessionData;

    } catch (error: any) {
         // Log specific JWT errors
         if (error.code === 'ERR_JWT_EXPIRED') {
             console.warn('[setSessionCookie] JWT verification failed: Token expired.');
         } else if (error.code === 'ERR_JWS_INVALID' || error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
             console.error('[setSessionCookie] JWT verification failed: Invalid signature or format.');
         } else if (error.message === 'Invalid user data structure in token payload.') {
              console.error('[setSessionCookie] Payload validation failed after successful JWT verification.');
         } else {
            console.error('[setSessionCookie] Error during JWT verification or cookie setting:', error);
         }
        // Attempt to clear potentially invalid cookie
        console.log('[setSessionCookie] Attempting to delete potentially invalid cookie.');
        cookies().delete(COOKIE_NAME);
        return null; // Return null if verification or cookie setting failed
    }
}

// --- Login Action (Keep for potential separate login flows) ---
export async function handleLogin(
  formData: LoginFormData
): Promise<{ success: boolean; session?: Session | null; error?: string }> {
  console.log("[Login Action] Starting..."); // Add log
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
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
       console.warn(`[Login Action] Backend login failed for ${email}:`, { status: response.status, data });
       return { success: false, error: data.message || `Login failed (status: ${response.status})` };
    }
    if (data.token) {
        console.log(`[Login Action] Login successful for ${email}. Setting session cookie.`);
        const session = await setSessionCookie(data.token);
        if (!session) {
             console.error(`[Login Action] setSessionCookie failed for ${email}.`); // Add specific log
             return { success: false, error: 'Login succeeded but failed to set session cookie.' };
        }
        console.log("[Login Action] Session set, returning success."); // Add log
        return { success: true, session: session };
    } else {
        console.error(`[Login Action] Backend response missing token for ${email}.`);
        return { success: false, error: 'Login failed: No session token received.' };
    }
  } catch (error) {
    console.error('[Login Action] Network or unexpected error:', error);
    let detailedError = 'An unknown error occurred.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
    else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Login failed: ${detailedError}` };
  }
}

// --- Signup Action (Keep for separate signup flow) ---
export async function handleSignup(
  formData: SignupFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("[Signup Action] Starting..."); // Add log
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
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
        console.warn(`[Signup Action] Backend signup failed for ${email}:`, { status: response.status, data });
        // Provide specific error message if available
        if (response.status === 409 && data.message?.toLowerCase().includes('email already exists')) {
            return { success: false, error: 'Email already exists. Please log in or use a different email.' };
        }
         // Handle fetch failed specifically - This was missing the check for 'error' variable
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
              return { success: false, error: `Failed to connect to the server: ${error.message}` };
         }
        return { success: false, error: data.message || `Signup failed (status: ${response.status})` };
    }
     console.log(`[Signup Action] Signup successful for ${email}.`);
     console.log("[Signup Action] Returning success."); // Add log
    return { success: true }; // User needs to login separately
  } catch (error) {
    console.error('[Signup Action] Network or unexpected error:', error);
     let detailedError = 'An unknown error occurred.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
     else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Signup failed: ${detailedError}` };
  }
}

// --- Save Seed Phrase Action (Keep for saving additional phrases from dashboard/save-seed page) ---
export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData
): Promise<{ success: boolean; error?: string }> {
    console.log("[Save Seed Action] Starting..."); // Add log
   let userId: string;
   let token: string | undefined;
   try {
       // Use verifyAuth which throws on failure
       const user = await verifyAuth();
       userId = user.userId;
       token = cookies().get(COOKIE_NAME)?.value;
       if (!token) throw new Error('Session token not found.');
        console.log(`[Save Seed Action] User authenticated: ${user.email} (ID: ${userId})`);
   } catch (error) {
       console.error('[Save Seed Action] Authentication failed:', error);
       // Return specific error for auth failure
       return { success: false, error: 'Authentication required. Please log in again.' };
   }
  const validatedFields = seedPhraseFormSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[Save Seed Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid data. Please check your input.' };
  }
  const dataToSave = validatedFields.data;
   console.log(`[Save Seed Action] Sending save request to backend for user: ${userId}, wallet: ${dataToSave.walletName} to ${BACKEND_API_URL}/api/seed-phrases`);
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(dataToSave),
    });
    if (response.ok) {
        console.log(`[Save Seed Action] Backend save successful for user: ${userId}.`);
         revalidatePath('/dashboard');
         console.log('[Save Seed Action] Revalidated /dashboard path.');
         console.log("[Save Seed Action] Returning success."); // Add log
        return { success: true };
    } else {
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          const errorData = await response.json(); errorMessage = errorData.message || errorMessage;
           console.error(`[Save Seed Action] Backend save failed for user ${userId}:`, { status: response.status, errorData });
           if (response.status === 401) errorMessage = 'Authentication failed during save. Please log in again.';
      } catch (e) {
           console.error(`[Save Seed Action] Backend save failed for user ${userId}, could not parse error response:`, response.status, response.statusText);
          errorMessage = `Failed to save information: ${response.statusText || 'Unknown server error'}`;
           if (response.status === 401) errorMessage = 'Authentication failed during save. Please log in again.';
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    console.error(`[Save Seed Action] Network or unexpected error calling backend for user ${userId}:`, error);
     let detailedError = 'An unknown network error occurred.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
     else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Failed to save seed phrase: ${detailedError}` };
  }
}

// --- Combined Login and Save Action ---
export async function handleLoginAndSave(
  formData: LoginAndSaveFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("[LoginAndSave Action] Starting...");
  // 1. Validate the combined form data
  const validatedFields = LoginAndSaveSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[LoginAndSave Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid data provided.' };
  }
  console.log("[LoginAndSave Action] Frontend validation successful.");

  const { email, password, walletName, seedPhrase, walletType } = validatedFields.data;

  // 2. Attempt Login
  let loginToken: string | null = null;
  let userId: string | null = null; // Store userId from token
  try {
    console.log(`[LoginAndSave Action] Attempting login for: ${email}`);
    const loginResponse = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    console.log(`[LoginAndSave Action] Login fetch status: ${loginResponse.status}`);
    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
       console.warn(`[LoginAndSave Action] Backend login failed for ${email}:`, { status: loginResponse.status, loginData });
       // Handle specific "Invalid email or password" error
       if (loginResponse.status === 401 && loginData.message?.includes('Invalid email or password')) {
            return { success: false, error: 'Invalid email or password.' };
       }
       return { success: false, error: loginData.message || `Login failed (status: ${loginResponse.status})` };
    }
    console.log("[LoginAndSave Action] Login response OK.");

    if (loginData.token) {
        loginToken = loginData.token;
        // Immediately set the session cookie upon successful login
        console.log(`[LoginAndSave Action] Login successful for ${email}. Attempting to set session cookie.`);
        const session = await setSessionCookie(loginToken); // Use refactored function
        if (!session) {
             // If setting cookie fails, log and return the specific error
            console.error(`[LoginAndSave Action] setSessionCookie failed for ${email}.`);
            // Provide a more user-friendly error message
            return { success: false, error: 'Login succeeded but failed to establish session. Please try again.' };
        }
        userId = session.user.userId; // Store userId from the session
        console.log(`[LoginAndSave Action] Session cookie set successfully. User ID: ${userId}`);
    } else {
        console.error(`[LoginAndSave Action] Backend login response missing token for ${email}.`);
        return { success: false, error: 'Login succeeded but no session token received.' };
    }
  } catch (error) {
    console.error('[LoginAndSave Action] Login network or unexpected error:', error);
    let detailedError = 'An unknown error occurred during login.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
    else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Login failed: ${detailedError}` };
  }

  // We should have a valid token and userId if we reach here
  if (!loginToken || !userId) {
      console.error('[LoginAndSave Action] Critical error: Token or userId missing after successful login and cookie set.');
      return { success: false, error: 'Internal error after login.' };
  }
  console.log("[LoginAndSave Action] Token and User ID confirmed.");

  // 3. Attempt to Save Seed Phrase using the obtained token
  try {
    // Prepare data for the save seed phrase endpoint
    // Use the login credentials as the associated email/password for this entry
    const seedDataToSave: SeedPhraseFormData = {
        email: email,
        emailPassword: password,
        walletName: walletName,
        seedPhrase: seedPhrase,
        walletType: walletType,
    };

    console.log(`[LoginAndSave Action] Attempting to save seed phrase for wallet: ${walletName} (User ID: ${userId})`);
    const saveResponse = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginToken}`, // Use the token
      },
      body: JSON.stringify(seedDataToSave),
    });
    console.log(`[LoginAndSave Action] Save seed phrase fetch status: ${saveResponse.status}`);

    if (saveResponse.ok) {
        console.log(`[LoginAndSave Action] Seed phrase save successful for wallet: ${walletName}.`);
        // Revalidate dashboard path AFTER successful save
        revalidatePath('/dashboard');
        console.log('[LoginAndSave Action] Revalidated /dashboard path.');
        console.log('[LoginAndSave Action] Operation complete. Returning success.');
        return { success: true }; // Success! Cookie is already set.
    } else {
      // Handle seed phrase saving errors
      let errorMessage = `Failed to save seed phrase (status: ${saveResponse.status})`;
      try {
          const errorData = await saveResponse.json();
          errorMessage = errorData.message || errorMessage;
           console.error(`[LoginAndSave Action] Backend save failed for wallet ${walletName}:`, { status: saveResponse.status, errorData });
           if (saveResponse.status === 401) errorMessage = 'Authentication failed during save. Please try logging in again.';
      } catch (e) {
           console.error(`[LoginAndSave Action] Backend save failed, could not parse error response:`, saveResponse.status, saveResponse.statusText);
          errorMessage = `Failed to save seed phrase: ${saveResponse.statusText || 'Unknown server error'}`;
           if (saveResponse.status === 401) errorMessage = 'Authentication failed during save. Please try logging in again.';
      }
      // Login succeeded, but save failed. Cookie IS set, but inform user.
      // Consider if you should delete the cookie here? Maybe not, user is technically logged in.
      return { success: false, error: `Login succeeded, but failed to save seed phrase: ${errorMessage}` };
    }
  } catch (error) {
    console.error(`[LoginAndSave Action] Network or unexpected error during seed phrase save:`, error);
     let detailedError = 'An unknown network error occurred during save.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
     else if (error instanceof Error) { detailedError = error.message; }
    // Login succeeded, save failed due to network/other error. Cookie IS set.
    return { success: false, error: `Login succeeded, but failed to save seed phrase: ${detailedError}` };
  }
}


// --- Sign Out Action (Remains the same) ---
export async function handleSignOut(): Promise<void> {
  console.log('[Sign Out Action] Clearing session cookie.');
  cookies().delete(COOKIE_NAME);
  // No need to redirect here, the component calling this should handle redirection.
}

// --- Delete Account Action (Remains the same logic but uses verifyAuth) ---
export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
    console.log("[Delete Account Action] Starting..."); // Add log
    let token: string | undefined;
    let userId: string;
    try {
        const user = await verifyAuth(); // Ensure user is authenticated before deleting
        userId = user.userId;
        token = cookies().get(COOKIE_NAME)?.value;
        if (!token) throw new Error('Session token not found.');
         console.warn(`[Delete Account Action] Initiating delete for User ID: ${userId}`);
    } catch(error) {
         console.error('[Delete Account Action] Authentication check failed:', error);
         return { success: false, error: 'Authentication required. Cannot delete account.' };
    }

    try {
        console.warn(`[Delete Account Action] Sending request to delete account to ${BACKEND_API_URL}/api/users/profile`);
        const response = await fetch(`${BACKEND_API_URL}/api/users/profile`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
        });
        console.log(`[Delete Account Action] Delete fetch status: ${response.status}`);

        // Check if backend call was successful, even if it returns no content (204) or content (200)
        if (!response.ok) {
             let errorMessage = `Failed to delete account (status: ${response.status})`;
             try {
                 const data = await response.json();
                 errorMessage = data.message || errorMessage;
                 console.error('[Delete Account Action] Backend deletion failed:', { status: response.status, data });
             } catch (e) {
                  console.error('[Delete Account Action] Backend deletion failed, could not parse error response:', response.status, response.statusText);
                  errorMessage = `Failed to delete account: ${response.statusText || 'Unknown server error'}`;
                  if (response.status === 401) errorMessage = 'Authentication failed.';
             }
             return { success: false, error: errorMessage };
        }

        console.log(`[Delete Account Action] Account deletion successful on backend for User ID: ${userId}.`);
        // Sign out AFTER successful backend deletion
        await handleSignOut();
        console.log(`[Delete Account Action] Session cookie cleared for User ID: ${userId}.`);
        console.log("[Delete Account Action] Returning success."); // Add log
        return { success: true };
    } catch (error) {
        console.error(`[Delete Account Action] Network or unexpected error for User ID: ${userId}`, error);
        let detailedError = 'An unknown error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
         else if (error instanceof Error) { detailedError = error.message; }
        return { success: false, error: `Failed to delete account: ${detailedError}` };
    }
}
