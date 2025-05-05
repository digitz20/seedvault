
'use server';

import type { LoginFormData, LoginResponseData } from '@/lib/definitions';
import { loginSchema, loginResponseSchema } from '@/lib/definitions';
import { cookies } from 'next/headers';

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function loginAction(
  formData: LoginFormData
): Promise<{ success: boolean; error?: string; user?: LoginResponseData['user'] }> {
  // 1. Validate data on the server-side (Next.js server action)
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Login Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: 'Invalid email or password.', // Keep error generic
    };
  }

  const credentials = validatedFields.data;
  console.log('[Login Action] Sending login request to backend for:', credentials.email);

  // 2. Call the backend API
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Check if the request was successful
    if (response.ok) {
        const result = await response.json();
        console.log('[Login Action] Backend login successful for:', credentials.email);

        // Validate the backend response structure (optional but recommended)
        const parsedResult = loginResponseSchema.safeParse(result);
        if (!parsedResult.success) {
            console.error('[Login Action] Invalid response structure from backend:', parsedResult.error);
            return { success: false, error: 'Received invalid data from server.' };
        }

        const { token, user } = parsedResult.data;

        // 3. Store the JWT token in an HTTP-only cookie
        cookies().set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day expiration (should match token expiry)
            path: '/',
            sameSite: 'lax',
        });
        console.log('[Login Action] Auth token cookie set.');

        return { success: true, user };

    } else {
      // Handle API errors (e.g., invalid credentials)
      let errorMessage = `Login failed with status: ${response.status}`;
      try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
           console.warn('[Login Action] Backend login failed:', errorMessage);
      } catch (e) {
           console.warn('[Login Action] Backend login failed, could not parse error response:', response.statusText);
          errorMessage = `Login failed: ${response.statusText}`;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    // Handle network errors
    console.error('[Login Action] Network or unexpected error calling backend:', error);
     const message = error instanceof Error ? error.message : 'An unknown network error occurred during login.';
    return {
      success: false,
      error: `Login failed: ${message}`,
    };
  }
}
