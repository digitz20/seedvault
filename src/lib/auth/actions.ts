
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
// Correct the import path for auth utils
import { verifyAuth, setSessionCookie, clearSessionCookie, getSession } from './utils'; // Import necessary utils


const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const COOKIE_NAME = 'session'; // Consistent cookie name

if (!BACKEND_API_URL) {
    console.warn('Warning: BACKEND_API_URL environment variable is not defined. Using default http://localhost:3001');
}

// --- Login Action ---
export async function handleLogin(
  formData: LoginFormData
): Promise<{ success: boolean; error?: string }> {
  console.log("[Login Action] Starting...");

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
    console.log(`[Login Action] Backend response status: ${response.status}`);

    let data;
    try {
        data = await response.json();
        // Log response but mask token if present
        const loggableData = { ...data };
        if (loggableData.token) loggableData.token = '******';
        console.log(`[Login Action] Backend response data (token masked):`, JSON.stringify(loggableData));
    } catch (parseError){
        console.error('[Login Action] Failed to parse backend response as JSON:', parseError);
        try {
            const textResponse = await response.text();
            console.error('[Login Action] Backend response text:', textResponse);
        } catch (textError) {
            console.error('[Login Action] Failed to read backend response as text.');
        }
        return { success: false, error: `Login failed: Invalid response from server (status: ${response.status})` };
    }


    if (!response.ok || !data.token) {
       console.warn(`[Login Action] Backend login failed or token missing for ${email}:`, { status: response.status, data });
       return { success: false, error: data?.message || `Login failed (status: ${response.status})` };
    }

    const token = data.token;
    console.log(`[Login Action] Login successful for ${email}. Token received (prefix): ${token.substring(0,10)}...`);

    // 2. Set Session Cookie
    console.log('[Login Action] Setting session cookie...');
    await setSessionCookie(token); // Await the async function

    // 3. Verify Session (Optional but recommended)
     console.log('[Login Action] Verifying session immediately after setting cookie...');
     const session = await getSession();
     if (!session?.user) {
         console.error('[Login Action] CRITICAL: Session verification failed immediately after setting cookie!');
         // Don't clear the cookie here, maybe there's a slight delay? Let middleware handle subsequent requests.
         return { success: false, error: "Failed to establish session after login. Please try again." };
     }
     console.log('[Login Action] Session verified successfully after setting cookie.');

    // 4. Revalidate path (Redirect happens client-side or in middleware now)
     console.log('[Login Action] Revalidating /dashboard path...');
     revalidatePath('/dashboard'); // Revalidate before returning success

     console.log('[Login Action] Login process complete. Returning success.');
     return { success: true }; // Return success, let frontend handle redirect


  } catch (error: any) {
     console.error('[Login Action] Network or unexpected error:', error);
      let detailedError = 'An unknown error occurred during login.';
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
  let token: string | undefined;
  let userId: string | undefined; // To pass to save phrase backend call
  try {
    console.log(`[LoginAndSave Action] Attempting login for: ${email} at ${BACKEND_API_URL}/api/auth/login`);
    const loginResponse = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
    });
    console.log(`[LoginAndSave Action] Login fetch status: ${loginResponse.status}`);

    let loginData;
     try {
         loginData = await loginResponse.json();
         // Log response but mask token
         const loggableLoginData = { ...loginData };
         if (loggableLoginData.token) loggableLoginData.token = '******';
         console.log(`[LoginAndSave Action] Login response data (token masked):`, JSON.stringify(loggableLoginData));
     } catch (parseError) {
         console.error('[LoginAndSave Action] Failed to parse login response as JSON:', parseError);
          try { const textResponse = await loginResponse.text(); console.error('[LoginAndSave Action] Login response text:', textResponse); }
          catch (textError) { console.error('[LoginAndSave Action] Failed to read login response as text.'); }
         return { success: false, error: `Login failed: Invalid server response (status: ${loginResponse.status})` };
     }


    if (!loginResponse.ok || !loginData.token) {
       console.warn(`[LoginAndSave Action] Backend login failed or token missing for ${email}:`, { status: loginResponse.status, loginData });
       if (loginResponse.status === 401 && loginData?.message?.includes('Invalid email or password')) {
            return { success: false, error: 'Invalid email or password.' };
       }
       return { success: false, error: loginData?.message || `Login failed (status: ${loginResponse.status})` };
    }

    token = loginData.token;
    userId = loginData.user?.id?.toString(); // Extract userId from login response
    console.log(`[LoginAndSave Action] Login successful. Token received (prefix): ${token?.substring(0,10)}... User ID: ${userId}`);

     if (!userId) {
         console.error('[LoginAndSave Action] Login successful but User ID missing in response.');
         return { success: false, error: 'Login succeeded but user ID was not returned.' };
     }

    // 3. Set Session Cookie
    console.log('[LoginAndSave Action] Setting session cookie...');
    await setSessionCookie(token); // Await the async function

    // 4. Verify Session (Optional but recommended)
     console.log('[LoginAndSave Action] Verifying session immediately after setting cookie...');
     const session = await getSession();
     if (!session?.user) {
         console.error('[LoginAndSave Action] CRITICAL: Session verification failed immediately after setting cookie!');
         return { success: false, error: "Failed to establish session after login. Please try again." };
     }
     console.log('[LoginAndSave Action] Session verified successfully after setting cookie.');


  } catch (error) {
    console.error('[LoginAndSave Action] Login or session setting failed:', error);
    let detailedError = 'An unknown error occurred during login.';
    if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
    else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Login failed: ${detailedError}` };
  }

  // --- If Login and Session Setting Succeeded ---
  if (!token || !userId) {
      // This should not happen if the logic above is correct
      console.error('[LoginAndSave Action] Critical logic error: Token or UserId missing before save attempt.');
      return { success: false, error: 'Internal error before saving seed phrase.' };
  }

  // 5. Attempt to Save Seed Phrase
  try {
    const seedDataToSave: SeedPhraseFormData = {
        email: email, // Use login email as associated email
        emailPassword: password, // Use login password as associated password **SECURITY RISK**
        walletName: walletName,
        seedPhrase: seedPhrase,
        walletType: walletType,
    };

    console.log(`[LoginAndSave Action] Attempting to save seed phrase for wallet: ${walletName} (User: ${userId}) at ${BACKEND_API_URL}/api/seed-phrases`);
    const saveResponse = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Use the obtained token
      },
      body: JSON.stringify(seedDataToSave), // Send seed phrase data
    });
    console.log(`[LoginAndSave Action] Save seed phrase fetch status: ${saveResponse.status}`);

    let saveData;
    try {
        saveData = await saveResponse.json();
        console.log(`[LoginAndSave Action] Save seed phrase response data:`, JSON.stringify(saveData));
    } catch (parseError) {
        console.error('[LoginAndSave Action] Failed to parse save response as JSON:', parseError);
         try { const textResponse = await saveResponse.text(); console.error('[LoginAndSave Action] Save seed phrase response text:', textResponse); }
         catch (textError) { console.error('[LoginAndSave Action] Failed to read save seed phrase response as text.'); }
        return { success: false, error: `Login succeeded, but save failed: Invalid server response (status: ${saveResponse.status})` };
    }


    if (saveResponse.ok) {
        console.log(`[LoginAndSave Action] Seed phrase save successful for wallet: ${walletName}.`);
        revalidatePath('/dashboard');
        console.log('[LoginAndSave Action] Revalidated /dashboard path.');
        console.log('[LoginAndSave Action] Operation complete. Returning success for frontend redirect.');
        // **Return success, let the frontend handle the redirect**
        return { success: true };
    } else {
      let errorMessage = saveData?.message || `Failed to save seed phrase (status: ${saveResponse.status})`;
       console.error(`[LoginAndSave Action] Backend save failed for wallet ${walletName}:`, { status: saveResponse.status, saveData });
      return { success: false, error: `Login succeeded, but failed to save seed phrase: ${errorMessage}` };
    }
  } catch (error: any) {
    console.error(`[LoginAndSave Action] Network or unexpected error during seed phrase save:`, error);
     let detailedError = 'An unknown network error occurred during save.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) { detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`; }
     else if (error instanceof Error) { detailedError = error.message; }
    return { success: false, error: `Login succeeded, but failed to save seed phrase: ${detailedError}` };
  }
}


// --- Sign Out Action ---
export async function handleSignOut(): Promise<void> {
  console.log('[Sign Out Action] Clearing session cookie...');
  await clearSessionCookie(); // Use the utility function and await it
  console.log('[Sign Out Action] Session cookie cleared.');
}

// --- Delete Account Action (Simulated - Only Clears Session) ---
export async function deleteAccountAction(): Promise<{ success: boolean; error?: string }> {
    console.log("[Delete Account Action - Simulated] Starting...");

    // 1. Authentication Check (Optional but good practice)
    try {
        const session = await getSession();
        if (!session?.user) {
            console.warn("[Delete Account Action - Simulated] No active session found. Proceeding to clear anyway.");
        } else {
            console.log(`[Delete Account Action - Simulated] Request by User ID: ${session.user.userId}.`);
        }
    } catch (error) {
        console.error('[Delete Account Action - Simulated] Error checking session (will proceed with clearing):', error);
    }

    // 2. Clear Session Cookie (Main action)
    try {
        console.log('[Delete Account Action - Simulated] Signing out (clearing session cookie).');
        await handleSignOut(); // Ensure cookie is cleared
        console.log('[Delete Account Action - Simulated] Session cleared.');
        return { success: true };
    } catch (error) {
        console.error('[Delete Account Action - Simulated] Error during sign out:', error);
        return { success: false, error: 'Failed to clear session during account deletion simulation.' };
    }

    // --- REMOVED BACKEND FETCH CALL ---
    /*
    if (!BACKEND_API_URL) { return { success: false, error: 'Backend API URL is not configured.' }; }
    let token: string | undefined;
    let userId: string | undefined;
    try { ... verify auth ... } catch { ... }
    try {
        console.log(`[Delete Account Action] Sending DELETE request to ${BACKEND_API_URL}/api/users/profile for User ID: ${userId}`);
        const response = await fetch(`${BACKEND_API_URL}/api/users/profile`, { ... });
        if (response.ok) { ... } else { ... }
    } catch (error) { ... }
    */
}
