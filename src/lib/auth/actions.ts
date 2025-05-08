'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
    LoginSchema,
    SignupSchema,
    seedPhraseFormSchema, // Keep schema for validation
    LoginAndSaveSchema, // Keep schema for validation
    userClientDataSchema // Keep for JWT payload validation if re-enabled
} from '@/lib/definitions';
import type {
    LoginFormData,
    SignupFormData,
    SeedPhraseFormData, // Keep for type safety
    LoginAndSaveFormData, // Keep for type safety
    UserClientData, // Keep for type safety if JWT re-enabled
    Session // Keep for type safety if JWT re-enabled
} from '@/lib/definitions';
import { revalidatePath } from 'next/cache'; // Keep for dashboard updates
// Removed authentication imports as auth is disabled
// import { verifyAuth, setSessionCookie, clearSessionCookie, getSession } from './utils';

// **Update BACKEND_API_URL to the provided Render URL**
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://seedvault.onrender.com';
const COOKIE_NAME = 'session'; // Keep for potential future use

if (!BACKEND_API_URL) {
    console.error('CRITICAL ERROR: BACKEND_API_URL is not defined and no default is set.');
} else {
    console.log(`[Auth Actions] Using Backend API URL: ${BACKEND_API_URL}`);
}


// --- Helper Function (if needed for simulated state) ---
// function simulateSession(email: string): void {
//     // Example: Use localStorage for simple client-side simulation (Not recommended for production)
//     // Ensure this runs only client-side if used
//     if (typeof window !== 'undefined') {
//         localStorage.setItem('simulatedUser', JSON.stringify({ email }));
//         console.log(`[Auth Actions] Simulated session set for ${email}`);
//     } else {
//         console.warn('[Auth Actions] Cannot simulate session on the server.');
//     }
// }

// --- Login Action (No Auth) ---
// Simulates login by checking credentials against the backend, but doesn't set a session cookie.
// Redirects to dashboard on success.
export async function handleLogin(
  formData: LoginFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("[Login Action - No Auth Simulation] Starting...");
  const validatedFields = LoginSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[Login Action - No Auth Simulation] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid email or password.' };
  }
  const { email, password } = validatedFields.data;

  try {
    console.log(`[Login Action - No Auth Simulation] Sending login request for email: ${email} to ${BACKEND_API_URL}/api/auth/login`);
    const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    console.log(`[Login Action - No Auth Simulation] Backend response status: ${response.status}`);

    // Regardless of the response, log it
    let data;
    try {
        data = await response.json();
        console.log(`[Login Action - No Auth Simulation] Backend response data:`, JSON.stringify(data));
    } catch (parseError){
        console.error('[Login Action - No Auth Simulation] Failed to parse backend response as JSON:', parseError);
        // Try reading as text for more info
        try {
            const textResponse = await response.text();
            console.error('[Login Action - No Auth Simulation] Backend response text:', textResponse);
        } catch (textError) {
            console.error('[Login Action - No Auth Simulation] Failed to read backend response as text.');
        }
        // Return a generic error if parsing fails
        return { success: false, error: `Login check failed: Invalid response from server (status: ${response.status})` };
    }


    if (!response.ok) {
       console.warn(`[Login Action - No Auth Simulation] Backend login check failed for ${email}:`, { status: response.status, data });
       return { success: false, error: data?.message || `Login failed (status: ${response.status})` };
    }

    // Simulate setting session locally if needed (e.g., for header display)
    // simulateSession(email); // If using localStorage simulation

    console.log(`[Login Action - No Auth Simulation] Login check successful for ${email}. Redirecting to dashboard.`);
    // Redirect immediately after successful *check*
    redirect('/dashboard');
    // Code below redirect won't execute.

  } catch (error: any) {
    console.error('[Login Action - No Auth Simulation] Network or unexpected error:', error);

    // Handle potential redirect errors specifically
    if (error.message === 'NEXT_REDIRECT') {
       console.log('[Login Action - No Auth Simulation] Caught NEXT_REDIRECT, re-throwing.');
       throw error;
    }

    let detailedError = 'An unknown error occurred during login check.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
    } else if (error instanceof Error) {
      detailedError = error.message;
    }
    // Return the error instead of redirecting
    return { success: false, error: `Login failed: ${detailedError}` };
  }
}

// --- Signup Action ---
export async function handleSignup(
  formData: SignupFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("[Signup Action] Starting...");
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

     // Always try to parse the response
     let data;
     try {
         data = await response.json();
         console.log(`[Signup Action] Backend response status: ${response.status}, data:`, JSON.stringify(data));
     } catch (parseError) {
         console.error('[Signup Action] Failed to parse backend response as JSON:', parseError);
          try {
              const textResponse = await response.text();
              console.error('[Signup Action] Backend response text:', textResponse);
          } catch (textError) {
              console.error('[Signup Action] Failed to read backend response as text.');
          }
         return { success: false, error: `Signup failed: Invalid response from server (status: ${response.status})` };
     }

    if (!response.ok) {
        console.warn(`[Signup Action] Backend signup failed for ${email}:`, { status: response.status, data });
        if (response.status === 409 && data?.message?.toLowerCase().includes('email already exists')) {
            return { success: false, error: 'Email already exists. Please log in or use a different email.' };
        }
        return { success: false, error: data?.message || `Signup failed (status: ${response.status})` };
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

// --- Combined Login and Save Action (No Auth) ---
// Simulates login check, then saves seed phrase (requires backend save endpoint to be public or handle request differently)
export async function handleLoginAndSave(
  formData: LoginAndSaveFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("[LoginAndSave Action - No Auth Simulation] Starting...");
  // 1. Validate the combined form data
  const validatedFields = LoginAndSaveSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error('[LoginAndSave Action - No Auth Simulation] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return { success: false, error: firstError || 'Invalid data provided.' };
  }
  console.log("[LoginAndSave Action - No Auth Simulation] Frontend validation successful.");

  const { email, password, walletName, seedPhrase, walletType } = validatedFields.data;

  // 2. Attempt Login Check (Simulated - doesn't establish session)
   let userId: string | null = null; // Store simulated userId
   let userEmail: string | null = null; // Store email for logging
  try {
    console.log(`[LoginAndSave Action - No Auth Simulation] Attempting login check for: ${email} at ${BACKEND_API_URL}/api/auth/login`);
    const loginResponse = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    console.log(`[LoginAndSave Action - No Auth Simulation] Login check fetch status: ${loginResponse.status}`);

    let loginData;
     try {
         loginData = await loginResponse.json();
         console.log(`[LoginAndSave Action - No Auth Simulation] Login check response data:`, JSON.stringify(loginData));
     } catch (parseError) {
         console.error('[LoginAndSave Action - No Auth Simulation] Failed to parse login check response as JSON:', parseError);
          try {
              const textResponse = await loginResponse.text();
              console.error('[LoginAndSave Action - No Auth Simulation] Login check response text:', textResponse);
          } catch (textError) {
              console.error('[LoginAndSave Action - No Auth Simulation] Failed to read login check response as text.');
          }
         return { success: false, error: `Login check failed: Invalid server response (status: ${loginResponse.status})` };
     }


    if (!loginResponse.ok) {
       console.warn(`[LoginAndSave Action - No Auth Simulation] Backend login check failed for ${email}:`, { status: loginResponse.status, loginData });
       if (loginResponse.status === 401 && loginData?.message?.includes('Invalid email or password')) {
            return { success: false, error: 'Invalid email or password.' };
       }
       return { success: false, error: loginData?.message || `Login check failed (status: ${loginResponse.status})` };
    }
    console.log("[LoginAndSave Action - No Auth Simulation] Login check successful.");
     // **SIMULATE**: Get user ID and email from the successful login check response
     if (loginData?.user?.id && loginData?.user?.email) {
         userId = loginData.user.id.toString(); // Assuming backend sends user info on login success
         userEmail = loginData.user.email;
         console.log(`[LoginAndSave Action - No Auth Simulation] Simulated User ID: ${userId}, Email: ${userEmail}`);
     } else {
         console.error('[LoginAndSave Action - No Auth Simulation] Login check OK, but user ID or email missing in response. Cannot save phrase.');
         return { success: false, error: 'Login check succeeded, but user data missing. Cannot save seed phrase.' };
     }

  } catch (error) {
    console.error('[LoginAndSave Action - No Auth Simulation] Login check network or unexpected error:', error);
    let detailedError = 'An unknown error occurred during login check.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
    else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Login check failed: ${detailedError}` };
  }

   // We should have a simulated userId and userEmail if we reach here
   if (!userId || !userEmail) {
       console.error('[LoginAndSave Action - No Auth Simulation] Critical error: Simulated userId or email missing after successful login check.');
       return { success: false, error: 'Internal error after login check.' };
   }

  // 3. Attempt to Save Seed Phrase (Backend MUST handle this potentially unauthenticated request)
  //    This assumes the backend /api/seed-phrases endpoint doesn't strictly require authentication token
  //    OR has been modified to accept saves based on other criteria (like matching email/password).
  //    **THIS IS A SECURITY RISK if not handled carefully on the backend.**
  try {
    const seedDataToSave: SeedPhraseFormData & { userId: string } = { // Add userId explicitly
        userId: userId, // Include the simulated userId
        email: userEmail, // Use login email as associated email
        emailPassword: password, // Use login password as associated password
        walletName: walletName,
        seedPhrase: seedPhrase,
        walletType: walletType,
    };

    console.log(`[LoginAndSave Action - No Auth Simulation] Attempting to save seed phrase for wallet: ${walletName} (Simulated User ID: ${userId}) at ${BACKEND_API_URL}/api/seed-phrases`);
    // **No Authorization header sent**
    const saveResponse = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seedDataToSave),
    });
    console.log(`[LoginAndSave Action - No Auth Simulation] Save seed phrase fetch status: ${saveResponse.status}`);

    // Always try to parse response
    let saveData;
    try {
        saveData = await saveResponse.json();
        console.log(`[LoginAndSave Action - No Auth Simulation] Save seed phrase response data:`, JSON.stringify(saveData));
    } catch (parseError) {
        console.error('[LoginAndSave Action - No Auth Simulation] Failed to parse save response as JSON:', parseError);
         try {
             const textResponse = await saveResponse.text();
             console.error('[LoginAndSave Action - No Auth Simulation] Save seed phrase response text:', textResponse);
         } catch (textError) {
             console.error('[LoginAndSave Action - No Auth Simulation] Failed to read save seed phrase response as text.');
         }
        return { success: false, error: `Login succeeded, but save failed: Invalid server response (status: ${saveResponse.status})` };
    }


    if (saveResponse.ok) {
        console.log(`[LoginAndSave Action - No Auth Simulation] Seed phrase save successful for wallet: ${walletName}.`);
        // simulateSession(userEmail); // Simulate session if needed
        revalidatePath('/dashboard');
        console.log('[LoginAndSave Action - No Auth Simulation] Revalidated /dashboard path.');
        console.log('[LoginAndSave Action - No Auth Simulation] Operation complete. Redirecting to dashboard...');
        redirect('/dashboard'); // Redirect AFTER successful save
        // Code below redirect won't execute

    } else {
      let errorMessage = saveData?.message || `Failed to save seed phrase (status: ${saveResponse.status})`;
       console.error(`[LoginAndSave Action - No Auth Simulation] Backend save failed for wallet ${walletName}:`, { status: saveResponse.status, saveData });
      return { success: false, error: `Login check succeeded, but failed to save seed phrase: ${errorMessage}` };
    }
  } catch (error: any) {
    console.error(`[LoginAndSave Action - No Auth Simulation] Network or unexpected error during seed phrase save:`, error);
    if (error.message === 'NEXT_REDIRECT') {
      console.log('[LoginAndSave Action - No Auth Simulation] Caught NEXT_REDIRECT, re-throwing.');
      throw error; // Re-throw redirect errors
    }
     let detailedError = 'An unknown network error occurred during save.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
     else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Login check succeeded, but failed to save seed phrase: ${detailedError}` };
  }
}

// --- Sign Out Action (No Auth) ---
// Primarily clears any local storage or state if needed, cookie clearing is irrelevant now.
export async function handleSignOut(): Promise<void> {
  console.log('[Sign Out Action - No Auth] Clearing client-side indicators if any.');
  // No cookie to clear. If you used localStorage for simulated state, clear it here.
  // if (typeof window !== 'undefined') {
  //     localStorage.removeItem('simulatedUser');
  //     console.log('[Sign Out Action - No Auth] Simulated localStorage cleared.');
  // }
}

// --- Delete Account Action (No Auth) ---
// This needs significant backend changes to work without auth.
// Currently simulates the action but cannot securely delete without a token.
export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
    console.warn("[Delete Account Action - No Auth Simulation] This action cannot securely delete data without authentication.");
    // Simulate success for UI flow
    console.log("[Delete Account Action - No Auth Simulation] Simulating success and sign out.");
    await handleSignOut(); // Clear any local simulated state
    return { success: true };
}
