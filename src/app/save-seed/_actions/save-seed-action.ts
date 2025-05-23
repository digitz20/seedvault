
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies
import { revalidatePath } from 'next/cache'; // Import revalidatePath
import { verifyAuth } from '@/lib/auth/utils'; // Import verifyAuth

// Use BACKEND_API_URL directly from process.env (set by next.config.ts)
const BACKEND_API_URL = process.env.BACKEND_API_URL;
const COOKIE_NAME = 'session'; // Consistent cookie name

if (!BACKEND_API_URL) {
    console.error('CRITICAL ERROR: BACKEND_API_URL is not defined in the environment.');
    // This action will fail if the URL is missing.
} else {
    console.log(`[Save Seed Action] Using Backend API URL from env: ${BACKEND_API_URL}`);
}

export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Use the form data type
  // Removed userEmail parameter, we get it from verifyAuth
): Promise<{ success: boolean; error?: string }> {
   if (!BACKEND_API_URL) return { success: false, error: 'Backend API URL is not configured.' };

  // 1. Authentication Check
   let userId: string;
   let userEmail: string; // To log which user is saving
   let token: string | undefined;
   try {
       const user = await verifyAuth(); // Verify session and get user data
       userId = user.userId;
       userEmail = user.email; // Get email from verified user
       token = cookies().get(COOKIE_NAME)?.value; // Get the token from the cookie
       if (!token) {
           throw new Error('Session token not found after verification.');
       }
        console.log(`[Save Seed Action] User authenticated: ${userEmail} (ID: ${userId})`);
   } catch (error) {
       console.error('[Save Seed Action] Authentication failed:', error);
        const message = error instanceof Error ? error.message : 'Authentication failed.';
       // It's better to redirect in the page component, but return error here
       return { success: false, error: 'Authentication required. Please log in again.' };
   }

  // 2. Validate the incoming form data using Zod schema
  const validatedFields = seedPhraseFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error(`[Save Seed Action] Frontend validation failed for user ${userId}:`, validatedFields.error.flatten().fieldErrors);
    // Extract the first validation error message
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return {
      success: false,
      error: firstError || 'Invalid data. Please check your input.',
    };
  }

  // Use the validated data (plain text)
  const dataToSave = validatedFields.data;

  // Log minimal info for debugging (avoid logging sensitive data)
   console.log(`[Save Seed Action] Sending save request to backend for user: ${userId}, wallet: ${dataToSave.walletName} to ${BACKEND_API_URL}/api/seed-phrases`);

  // 3. Call the backend API to save the information (plain text)
  try {
    // API endpoint for saving seed phrases (POST request)
    const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header with the JWT token
        'Authorization': `Bearer ${token}`,
      },
      // Send the validated plain text data
      body: JSON.stringify(dataToSave),
    });

    // Check if the request was successful (e.g., 201 Created)
    if (response.ok) { // Status codes 200-299 are considered ok
        console.log(`[Save Seed Action] Backend save successful for user: ${userId}.`);
         // Revalidate the dashboard path to show the newly added phrase
         revalidatePath('/dashboard');
         console.log('[Save Seed Action] Revalidated /dashboard path.');
        return { success: true };
    } else {
      // Handle API errors (e.g., 400 Bad Request, 401 Unauthorized, 500)
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          // Attempt to parse error response from backend
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
           console.error(`[Save Seed Action] Backend save failed for user ${userId}:`, { status: response.status, errorData });
           if (response.status === 401) { // Check specific status
               errorMessage = 'Authentication failed on backend. Please log in again.';
           }
      } catch (e) {
           console.error(`[Save Seed Action] Backend save failed for user ${userId}, could not parse error response:`, response.status, response.statusText);
          errorMessage = `Failed to save information: ${response.statusText || 'Unknown server error'}`;
           if (response.status === 401) { // Check specific status
               errorMessage = 'Authentication failed on backend. Please log in again.';
           }
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors or other unexpected issues during fetch
    console.error(`[Save Seed Action] Network or unexpected error calling backend for user ${userId}:`, error);
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
