
'use server';

import type { SignupFormData } from '@/lib/definitions';
import { signupSchema } from '@/lib/definitions';

// Base URL for your backend API (adjust as needed, use environment variable)
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function signupAction(
  formData: SignupFormData
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate data on the server-side (Next.js server action) first
  const validatedFields = signupSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Signup Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid signup data. Please check your input.',
    };
  }

  const dataToSend = validatedFields.data;
  console.log('[Signup Action] Sending signup request to backend:', { email: dataToSend.email });

  // 2. Call the backend API
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    // Check if the request was successful
    if (response.ok) {
        console.log('[Signup Action] Backend signup successful for:', dataToSend.email);
        const result = await response.json(); // Optional: read success message
        return { success: true };
    } else {
      // Handle API errors (e.g., email exists, validation failed on backend)
      let errorMessage = `Signup failed with status: ${response.status}`;
      try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage; // Use backend message if available
          console.error('[Signup Action] Backend signup failed:', errorMessage);
      } catch (e) {
          console.error('[Signup Action] Backend signup failed, could not parse error response:', response.statusText);
          errorMessage = `Signup failed: ${response.statusText}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors or other unexpected issues
    console.error('[Signup Action] Network or unexpected error calling backend:', error);
     const message = error instanceof Error ? error.message : 'An unknown network error occurred during signup.';
    return {
      success: false,
      error: `Signup failed: ${message}`,
    };
  }
}
