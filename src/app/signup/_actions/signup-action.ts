'use server';

import type { SignupFormData } from '@/lib/definitions';
import { signupSchema } from '@/lib/definitions';
// Import hashing library in a real app: import bcrypt from 'bcrypt';
// Import database client/functions in a real app

// --- Mock Database ---
// In a real app, replace this with actual database interaction (e.g., MongoDB, PostgreSQL)
const mockUserDatabase: { email: string; hashedPassword: string; id: string }[] = [];
let userIdCounter = 1;
// ---------------------

async function mockDatabaseSignup(data: SignupFormData): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  console.log('[Signup Action] Received data:', data);

  // Simulate checking if email already exists
  const existingUser = mockUserDatabase.find(user => user.email === data.email);
  if (existingUser) {
    console.warn('[Signup Action] Mock DB: Email already exists');
    return { success: false, error: 'Email already exists. Please log in or use a different email.' };
  }

  // Simulate password hashing (replace with actual bcrypt hashing)
  // const saltRounds = 10;
  // const hashedPassword = await bcrypt.hash(data.password, saltRounds);
  const hashedPassword = `hashed(${data.password})`; // Mock hashing
  console.log('[Signup Action] Simulated Hashed Password:', hashedPassword);

  // Simulate saving to database
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser = {
          id: `user-${userIdCounter++}`,
          email: data.email,
          hashedPassword: hashedPassword, // Store hashed password
      };
      mockUserDatabase.push(newUser);
      console.log('[Signup Action] Mock user created successfully:', { id: newUser.id, email: newUser.email });
      resolve({ success: true, userId: newUser.id });
    }, 1000); // Simulate network latency
  });
}


export async function signupAction(
  formData: SignupFormData
): Promise<{ success: boolean; error?: string; userId?: string }> {
  // 1. Validate data on the server
  const validatedFields = signupSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Signup Action] Server-side validation failed:', validatedFields.error.flatten().fieldErrors);
    // Construct a user-friendly error message from validation errors
     const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid signup data. Please check your input.',
    };
  }

  const dataToSave = validatedFields.data;

  // 2. **IMPORTANT**: Implement actual password hashing and database saving here
  try {
    const result = await mockDatabaseSignup(dataToSave);

    if (!result.success) {
       console.error('[Signup Action] Database signup failed:', result.error);
      return { success: false, error: result.error };
    }

    console.log('[Signup Action] User signed up successfully:', { email: dataToSave.email, userId: result.userId });
    return { success: true, userId: result.userId };

  } catch (error) {
    console.error('[Signup Action] Unexpected error during signup:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred during signup.';
    return {
      success: false,
      error: `Server error: ${message}`,
    };
  }
}
