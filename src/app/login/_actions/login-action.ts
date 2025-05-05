'use server';

import type { LoginFormData } from '@/lib/definitions';
import { loginSchema } from '@/lib/definitions';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { getUsersCollection } from '@/lib/mongodb';
import type { User } from '@/lib/definitions'; // Import the User type

// --- Session Management ---
// Replace with a robust session library (e.g., next-auth, iron-session)
// or JWTs stored securely in HTTP-only cookies in a real application.
async function createSession(userId: string): Promise<string> {
    console.log(`[Login Action] Creating session for userId: ${userId}`);
    const sessionId = `session-${userId}-${Date.now()}`; // Simple session ID
    // Store the session ID in an HTTP-only cookie
    cookies().set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Ensure secure cookies in production
        maxAge: 60 * 60 * 24 * 7, // 1 week expiration
        path: '/', // Available across the entire site
        sameSite: 'lax', // Recommended for most use cases
    });
    console.log(`[Login Action] Session cookie set: ${sessionId}`);
    // In a real app, you'd likely store session details (like expiry, user agent)
    // in a database associated with this sessionId.
    return sessionId;
}
// ---------------------------


// --- Database Login Logic ---
async function databaseLogin(data: LoginFormData): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  console.log('[Login Action] Attempting DB login for:', data.email);
  const usersCollection = await getUsersCollection();

  try {
    // Find user by email
    const user = await usersCollection.findOne({ email: data.email });

    if (!user) {
      console.warn('[Login Action] DB: User not found');
      // Return a generic error to avoid user enumeration
      return { success: false, error: 'Invalid email or password.' };
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatch) {
      console.warn('[Login Action] DB: Password mismatch for user:', user.email);
      // Return a generic error
      return { success: false, error: 'Invalid email or password.' };
    }

    const userId = user._id.toString(); // Convert ObjectId to string
    console.log('[Login Action] DB: Login successful for userId:', userId);
    return { success: true, userId: userId };

  } catch (error) {
      console.error('[Login Action] DB: Error during login process:', error);
      return { success: false, error: 'Database error during login.' };
  }
}


export async function loginAction(
  formData: LoginFormData
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate data on the server
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Login Action] Server-side validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: 'Invalid email or password.', // Keep error generic
    };
  }

  const credentials = validatedFields.data;

  // 2. Authenticate against the database
  try {
    const loginResult = await databaseLogin(credentials);

    if (!loginResult.success) {
       // Error already logged in databaseLogin
       return { success: false, error: loginResult.error }; // Use the specific (but generic) error message
    }

    // 3. Create a secure session upon successful login
    await createSession(loginResult.userId);

    console.log('[Login Action] Login successful, session created for:', credentials.email);
    return { success: true };

  } catch (error) {
    // Catch unexpected errors not handled within databaseLogin or createSession
    console.error('[Login Action] Unexpected error during login:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred during login.';
    return {
      success: false,
      // Be cautious about exposing details in production
      error: process.env.NODE_ENV === 'development' ? `Server error: ${message}` : 'An error occurred during login. Please try again.',
    };
  }
}
