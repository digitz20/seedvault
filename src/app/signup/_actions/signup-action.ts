'use server';

import type { SignupFormData } from '@/lib/definitions';
import { signupSchema } from '@/lib/definitions';
import bcrypt from 'bcrypt';
import { getUsersCollection } from '@/lib/mongodb';
import { MongoServerError } from 'mongodb';

// --- Database Interaction ---
async function databaseSignup(data: SignupFormData): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  console.log('[Signup Action] Received data for DB:', data);
  const usersCollection = await getUsersCollection();

  // Check if email already exists
  try {
    const existingUser = await usersCollection.findOne({ email: data.email });
    if (existingUser) {
      console.warn('[Signup Action] DB: Email already exists');
      return { success: false, error: 'Email already exists. Please log in or use a different email.' };
    }
  } catch (error) {
     console.error('[Signup Action] DB: Error checking for existing user:', error);
     return { success: false, error: 'Database error during signup preparation.' };
  }


  // Hash the password
  const saltRounds = 10;
  let passwordHash: string;
  try {
      passwordHash = await bcrypt.hash(data.password, saltRounds);
      console.log('[Signup Action] Password hashed successfully.');
  } catch (hashError) {
      console.error('[Signup Action] Error hashing password:', hashError);
      return { success: false, error: 'Error securing password.' };
  }


  // Save the new user to the database
  try {
    const newUser = {
      email: data.email,
      passwordHash: passwordHash,
      createdAt: new Date(),
    };
    const result = await usersCollection.insertOne(newUser);

    if (!result.insertedId) {
        console.error('[Signup Action] DB: User insertion failed.');
        return { success: false, error: 'Failed to create user account.' };
    }

    const userId = result.insertedId.toString(); // Convert ObjectId to string
    console.log('[Signup Action] DB: User created successfully:', { userId: userId, email: data.email });
    return { success: true, userId: userId };

  } catch (error) {
     if (error instanceof MongoServerError && error.code === 11000) { // Duplicate key error
       console.warn('[Signup Action] DB: Email already exists (caught by unique index)');
       return { success: false, error: 'Email already exists. Please log in or use a different email.' };
     }
     console.error('[Signup Action] DB: Error inserting user:', error);
     return { success: false, error: 'Database error creating user account.' };
  }
}


export async function signupAction(
  formData: SignupFormData
): Promise<{ success: boolean; error?: string; userId?: string }> {
  // 1. Validate data on the server
  const validatedFields = signupSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Signup Action] Server-side validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid signup data. Please check your input.',
    };
  }

  const dataToSave = validatedFields.data;

  // 2. Perform database signup logic
  try {
    const result = await databaseSignup(dataToSave);

    if (!result.success) {
       // Don't log error here again, it's logged within databaseSignup
       return { success: false, error: result.error };
    }

    console.log('[Signup Action] User signed up successfully:', { email: dataToSave.email, userId: result.userId });
    return { success: true, userId: result.userId };

  } catch (error) {
    // Catch unexpected errors not handled within databaseSignup
    console.error('[Signup Action] Unexpected error during signup:', error);
    const message = error instanceof Error ? error.message : 'An unknown server error occurred during signup.';
    return {
      success: false,
      error: `Server error: ${message}`, // Be cautious about exposing error details
    };
  }
}
