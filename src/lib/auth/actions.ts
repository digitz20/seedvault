
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
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
    UserClientData
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

// Helper function to set the session cookie remains the same
async function setSessionCookie(token: string) {
    let expires: Date | undefined;
    try {
        const { default: jwtDecode } = await import('jwt-decode');
        const decoded: { exp?: number } = jwtDecode(token);
        if (decoded.exp) {
            expires = new Date(decoded.exp * 1000);
        } else {
             console.warn('[Auth Actions] JWT token does not contain an expiration claim.');
             expires = new Date(Date.now() + 60 * 60 * 1000); // Fallback 1 hour
        }
    } catch (error) {
        console.error('[Auth Actions] Error decoding JWT for expiration:', error);
         expires = new Date(Date.now() + 60 * 60 * 1000); // Fallback 1 hour
    }

    cookies().set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expires ? Math.floor((expires.getTime() - Date.now()) / 1000) : undefined,
        expires: expires,
        path: '/',
        sameSite: 'lax',
    });
    console.log(`[Auth Actions] Session cookie set. Expires: ${expires?.toISOString()}`);
}

// --- Login Action (Keep for potential separate login flows) ---
export async function handleLogin(
  formData: LoginFormData
): Promise<{ success: boolean; error?: string }> {
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
        await setSessionCookie(data.token);
        return { success: true };
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
        return { success: false, error: data.message || `Signup failed (status: ${response.status})` };
    }
     console.log(`[Signup Action] Signup successful for ${email}.`);
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
   let userId: string;
   let token: string | undefined;
   try {
       const user = await verifyAuth();
       userId = user.userId;
       token = cookies().get(COOKIE_NAME)?.value;
       if (!token) throw new Error('Session token not found.');
        console.log(`[Save Seed Action] User authenticated: ${user.email} (ID: ${userId})`);
   } catch (error) {
       console.error('[Save Seed Action] Authentication failed:', error);
        const message = error instanceof Error ? error.message : 'Authentication failed.';
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
        return { success: true };
    } else {
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          const errorData = await response.json(); errorMessage = errorData.message || errorMessage;
           console.error(`[Save Seed Action] Backend save failed for user ${userId}:`, { status: response.status, errorData });
      } catch (e) {
           console.error(`[Save Seed Action] Backend save failed for user ${userId}, could not parse error response:`, response.status, response.statusText);
          errorMessage = `Failed to save information: ${response.statusText || 'Unknown server error'}`;
           if (response.status === 401) errorMessage = 'Authentication failed. Please log in again.';
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

// --- NEW Combined Login and Save Action ---
export async function handleLoginAndSave(
  formData: LoginAndSaveFormData
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate the combined form data
  const validatedFields = LoginAndSaveSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[LoginAndSave Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid data provided.' };
  }

  const { email, password, walletName, seedPhrase, walletType } = validatedFields.data;

  // 2. Attempt Login
  let loginToken: string | null = null;
  try {
    console.log(`[LoginAndSave Action] Attempting login for: ${email}`);
    const loginResponse = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
       console.warn(`[LoginAndSave Action] Backend login failed for ${email}:`, { status: loginResponse.status, loginData });
       return { success: false, error: loginData.message || `Login failed: Invalid email or password.` }; // Specific error
    }

    if (loginData.token) {
        loginToken = loginData.token;
        console.log(`[LoginAndSave Action] Login successful for ${email}.`);
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

  // If login succeeded and we have a token, proceed to save seed phrase
  if (!loginToken) {
      // This case should ideally not be reached if error handling above is correct
      return { success: false, error: 'Login token missing after successful login attempt.' };
  }

  // 3. Attempt to Save Seed Phrase using the obtained token
  try {
    // Prepare data for the save seed phrase endpoint
    // The backend expects `email` and `emailPassword` for the *saved entry*,
    // which in this combined flow are the same as the login credentials.
    const seedDataToSave: SeedPhraseFormData = {
        email: email, // Use the login email as the associated email
        emailPassword: password, // Use the login password as the associated password
        walletName: walletName,
        seedPhrase: seedPhrase,
        walletType: walletType,
    };

    console.log(`[LoginAndSave Action] Attempting to save seed phrase for wallet: ${walletName}`);
    const saveResponse = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginToken}`, // Use the token obtained from login
      },
      body: JSON.stringify(seedDataToSave),
    });

    if (saveResponse.ok) {
        console.log(`[LoginAndSave Action] Seed phrase save successful for wallet: ${walletName}. Setting cookie.`);
        // Save was successful, now set the session cookie
        await setSessionCookie(loginToken);
        revalidatePath('/dashboard'); // Revalidate dashboard path to show new data
        console.log('[LoginAndSave Action] Revalidated /dashboard path.');
        return { success: true };
    } else {
      // Handle seed phrase saving errors
      let errorMessage = `Failed to save seed phrase (status: ${saveResponse.status})`;
      try {
          const errorData = await saveResponse.json();
          errorMessage = errorData.message || errorMessage;
           console.error(`[LoginAndSave Action] Backend save failed for wallet ${walletName}:`, { status: saveResponse.status, errorData });
      } catch (e) {
           console.error(`[LoginAndSave Action] Backend save failed, could not parse error response:`, saveResponse.status, saveResponse.statusText);
          errorMessage = `Failed to save seed phrase: ${saveResponse.statusText || 'Unknown server error'}`;
           if (saveResponse.status === 401) errorMessage = 'Authentication failed during save.'; // Should not happen if token is valid
      }
      // Even if save fails, the login *might* have succeeded, but we don't set the cookie
      return { success: false, error: `Login succeeded, but failed to save seed phrase: ${errorMessage}` };
    }
  } catch (error) {
    console.error(`[LoginAndSave Action] Network or unexpected error during seed phrase save:`, error);
     let detailedError = 'An unknown network error occurred during save.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
     else if (error instanceof Error) { detailedError = error.message; }
    // Login succeeded, save failed due to network/other error
    return { success: false, error: `Login succeeded, but failed to save seed phrase: ${detailedError}` };
  }
}


// --- Sign Out Action (Remains the same) ---
export async function handleSignOut(): Promise<void> {
  console.log('[Sign Out Action] Clearing session cookie.');
  cookies().delete(COOKIE_NAME);
}

// --- Delete Account Action (Remains the same) ---
export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
    const sessionCookie = cookies().get(COOKIE_NAME)?.value;
    if (!sessionCookie) return { success: false, error: 'Not authenticated. Cannot delete account.' };
    try {
        console.warn(`[Delete Account Action] Sending request to delete account to ${BACKEND_API_URL}/api/users/profile`);
        const response = await fetch(`${BACKEND_API_URL}/api/users/profile`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${sessionCookie}` },
        });
        const data = await response.json();
        if (!response.ok) {
             console.error('[Delete Account Action] Backend deletion failed:', { status: response.status, data });
             return { success: false, error: data.message || `Failed to delete account (status: ${response.status})` };
        }
        console.log('[Delete Account Action] Account deletion successful on backend.');
        await handleSignOut();
        return { success: true };
    } catch (error) {
        console.error('[Delete Account Action] Network or unexpected error:', error);
        let detailedError = 'An unknown error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
         else if (error instanceof Error) { detailedError = error.message; }
        return { success: false, error: `Failed to delete account: ${detailedError}` };
    }
}
