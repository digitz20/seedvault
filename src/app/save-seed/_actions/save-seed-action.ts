
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';
// Removed: import { revalidatePath } from 'next/cache'; // Revalidation might happen differently or not be needed if using client-side state/refresh
import { cookies } from 'next/headers';
// Removed: import { getSeedPhrasesCollection, getUsersCollection } from '@/lib/mongodb';
// Removed: import { ObjectId } from 'mongodb';

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// --- Removed Encryption Logic ---
// Encryption should now happen on the backend server.
// --- End Removed Encryption Logic ---


// --- Removed Session/User ID Retrieval ---
// The backend will identify the user based on the JWT token sent.
// --- End Removed Session/User ID Retrieval ---


export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Expecting data matching the form schema
): Promise<{ success: boolean; error?: string }> {

  // 1. Validate the incoming form data
  const validatedFields = seedPhraseFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Save Seed Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid seed phrase data. Please check your input.',
    };
  }

  const dataToSave = validatedFields.data;
  console.log('[Save Seed Action] Sending save request to backend:', { walletName: dataToSave.walletName, walletType: dataToSave.walletType }); // Don't log seed

  // 2. Get the auth token from cookies
  const token = cookies().get('auth_token')?.value;
  if (!token) {
      console.warn('[Save Seed Action] Auth token not found in cookies.');
      return { success: false, error: 'User not authenticated. Please log in.' };
  }

  // 3. Call the backend API to save the seed phrase
  try {
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
        // Optionally parse the response if the backend returns the saved item ID, etc.
        // const savedItem = await response.json();
        // Revalidation might be handled by client-side router refresh if needed
        // revalidatePath('/dashboard');
        return { success: true };
    } else {
      // Handle API errors
      let errorMessage = `Failed to save seed phrase (status: ${response.status})`;
      try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
           console.error('[Save Seed Action] Backend save failed:', errorMessage);
      } catch (e) {
           console.error('[Save Seed Action] Backend save failed, could not parse error response:', response.statusText);
          errorMessage = `Failed to save seed phrase: ${response.statusText}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors
    console.error('[Save Seed Action] Network or unexpected error calling backend:', error);
     const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
    return {
      success: false,
      error: `Failed to save seed phrase: ${message}`,
    };
  }
}
