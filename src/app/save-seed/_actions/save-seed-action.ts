
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';
// import { cookies } from 'next/headers'; // No longer needed for auth token
import { revalidatePath } from 'next/cache';
// import { verifyAuth } from '@/lib/auth/utils'; // Removed authentication

// **Update BACKEND_API_URL to the provided Render URL**
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://seedvault.onrender.com';
// const COOKIE_NAME = 'session'; // No longer needed

if (!BACKEND_API_URL) {
    console.error('CRITICAL ERROR: BACKEND_API_URL is not defined and no default is set.');
} else {
    console.log(`[Save Seed Action] Using Backend API URL: ${BACKEND_API_URL}`);
}

// Save Seed Phrase Action (No Authentication)
// **WARNING:** This action now calls the backend endpoint without an authentication token.
// The backend endpoint `/api/seed-phrases` MUST be updated to handle this appropriately.
// It might need to identify the user based on email/password in the request body
// or become a public endpoint (which has significant security implications).
export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Use the form data type
): Promise<{ success: boolean; error?: string }> {
  console.log("[Save Seed Action - No Auth] Starting...");

  // 1. Authentication Check - REMOVED
  // let userId: string;
  // let token: string | undefined;
  // try { ... verifyAuth logic removed ... } catch { ... }

  // 2. Validate the incoming form data using Zod schema
  const validatedFields = seedPhraseFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Save Seed Action - No Auth] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return {
      success: false,
      error: firstError || 'Invalid data. Please check your input.',
    };
  }

  // Use the validated data (plain text)
  const dataToSave = validatedFields.data;

  // Log minimal info for debugging (avoid logging sensitive data)
   console.log(`[Save Seed Action - No Auth] Sending save request to backend for wallet: ${dataToSave.walletName} (Email: ${dataToSave.email}) to ${BACKEND_API_URL}/api/seed-phrases`);

  // 3. Call the backend API to save the information (plain text)
  // **WARNING:** No Authorization header is sent.
  try {
    // API endpoint for saving seed phrases (POST request)
    const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // **NO Authorization header**
        // 'Authorization': `Bearer ${token}`,
      },
      // Send the validated plain text data
      body: JSON.stringify(dataToSave),
    });
     console.log(`[Save Seed Action - No Auth] Backend response status: ${response.status}`);

     // Always try to parse response
     let data;
     try {
         data = await response.json();
         console.log(`[Save Seed Action - No Auth] Backend response data:`, JSON.stringify(data));
     } catch (parseError) {
         console.error('[Save Seed Action - No Auth] Failed to parse backend response as JSON:', parseError);
          try {
              const textResponse = await response.text();
              console.error('[Save Seed Action - No Auth] Backend response text:', textResponse);
          } catch (textError) {
               console.error('[Save Seed Action - No Auth] Failed to read backend response as text.');
          }
         return { success: false, error: `Save failed: Invalid response from server (status: ${response.status})` };
     }


    // Check if the request was successful (e.g., 201 Created)
    if (response.ok) { // Status codes 200-299 are considered ok
        console.log(`[Save Seed Action - No Auth] Backend save successful for wallet: ${dataToSave.walletName}.`);
         // Revalidate the dashboard path to show the newly added phrase
         revalidatePath('/dashboard');
         console.log('[Save Seed Action - No Auth] Revalidated /dashboard path.');
        return { success: true };
    } else {
      // Handle API errors
      let errorMessage = data?.message || `Failed to save information (status: ${response.status})`;
      console.error(`[Save Seed Action - No Auth] Backend save failed for wallet ${dataToSave.walletName}:`, { status: response.status, data });
       // If backend still requires auth, this will likely be 401/403
       if (response.status === 401 || response.status === 403) {
           errorMessage = 'Backend expects authentication which is currently disabled in the frontend.';
       }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors or other unexpected issues during fetch
    console.error(`[Save Seed Action - No Auth] Network or unexpected error calling backend for wallet ${dataToSave.walletName}:`, error);
     let detailedError = 'An unknown network error occurred.';
     if (error instanceof TypeError && error.message.includes('fetch failed')) {
         detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
     } else if (error instanceof Error) {
         detailedError = error.message;
     }
    return {
      success: false,
      error: `Failed to save seed phrase: ${detailedError}`,
    };
  }
}

```