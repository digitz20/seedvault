'use server';

import type { LoginFormData } from '@/lib/definitions';
import { loginSchema } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies
// Import hashing library in a real app: import bcrypt from 'bcrypt';
// Import database client/functions in a real app

// --- Mock Database (Should match the one in signup-action) ---
// In a real app, this would interact with your actual user database.
const mockUserDatabase: { email: string; hashedPassword: string; id: string }[] = [
    // Example user added during signup simulation
    // { id: 'user-1', email: 'test@example.com', hashedPassword: 'hashed(password123)' }
];
// Ensure this mock database reflects users created via signup for testing.
// ---------------------

// --- Mock Session Management ---
// In a real app, use a robust session library (e.g., next-auth, iron-session)
// or JWTs stored securely in HTTP-only cookies.
async function createMockSession(userId: string): Promise<string> {
    console.log(`[Login Action] Creating mock session for userId: ${userId}`);
    const sessionId = `mock-session-${userId}-${Date.now()}`;
    // Simulate setting an HTTP-only cookie
    cookies().set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
        // sameSite: 'lax', // Consider 'strict' or 'lax'
    });
    console.log(`[Login Action] Mock session cookie set: ${sessionId}`);
    return sessionId; // Returning for logging, not typically needed by caller
}
// ---------------------------


async function mockDatabaseLogin(data: LoginFormData): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  console.log('[Login Action] Attempting login for:', data.email);

  // Simulate finding user by email
  const user = mockUserDatabase.find(u => u.email === data.email);

  if (!user) {
    console.warn('[Login Action] Mock DB: User not found');
    return { success: false, error: 'Invalid email or password.' };
  }

  // Simulate password comparison (replace with actual bcrypt.compare)
  // const passwordMatch = await bcrypt.compare(data.password, user.hashedPassword);
  const passwordMatch = `hashed(${data.password})` === user.hashedPassword; // Mock comparison

  if (!passwordMatch) {
    console.warn('[Login Action] Mock DB: Password mismatch');
    return { success: false, error: 'Invalid email or password.' };
  }

  console.log('[Login Action] Mock DB: Login successful for userId:', user.id);
  return { success: true, userId: user.id };
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
      error: 'Invalid email or password.', // Keep error generic for security
    };
  }

  const credentials = validatedFields.data;

  // 2. **IMPORTANT**: Implement actual database lookup and password verification here
  try {
    const loginResult = await mockDatabaseLogin(credentials);

    if (!loginResult.success) {
       console.error('[Login Action] Authentication failed:', loginResult.error);
      // Keep error generic for security
      return { success: false, error: 'Invalid email or password.' };
    }

    // 3. **IMPORTANT**: Create a secure session upon successful login
    await createMockSession(loginResult.userId);

    console.log('[Login Action] Login successful, session created for:', credentials.email);
    return { success: true };

  } catch (error) {
    console.error('[Login Action] Unexpected error during login:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred during login.';
    // Avoid leaking specific details in production error messages
    return {
      success: false,
      // In production, log the detailed error but return a generic message
      error: process.env.NODE_ENV === 'development' ? `Server error: ${message}` : 'An error occurred during login. Please try again.',
    };
  }
}
