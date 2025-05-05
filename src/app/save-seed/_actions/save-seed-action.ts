'use server';

import type { Omit } from 'utility-types';
import { seedPhraseSchema } from '@/lib/definitions';
import type { SeedPhraseFormData, SeedPhraseData } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers'; // Import cookies

// Define the type for data coming from the client form (without email/userId)
type SeedPhraseFormClientData = Omit<SeedPhraseFormData, 'email' | 'userId'>;

// --- Mock Session Retrieval ---
// In a real app, use your session library to get the authenticated user's ID
async function getMockUserIdFromSession(): Promise<string | null> {
  const sessionId = cookies().get('session_id')?.value;
  if (sessionId && sessionId.startsWith('mock-session-')) {
    // Extract userId from the mock session ID (adjust based on your mock format)
    const userId = sessionId.split('-')[2];
    console.log('[Save Seed Action] Retrieved mock userId from session:', userId);
    return userId;
  }
  console.warn('[Save Seed Action] No valid mock session found.');
  return null;
}
// ----------------------------

// --- Mock Database for Seed Phrases ---
// In a real app, replace with actual database interaction (e.g., MongoDB)
const mockSeedPhraseDatabase: SeedPhraseData[] = [];
let seedPhraseIdCounter = 1;
// -------------------------------------


// Updated mock save function to accept full SeedPhraseData including userId
async function mockDatabaseSave(data: SeedPhraseData): Promise<{ success: true; id: string } | { success: false; error: string }> {
  console.log('[Save Seed Action - Mock DB] Received data:', data);

  // Simulate encryption (replace with actual encryption)
  const encryptedSeedPhrase = `encrypted(${data.seedPhrase.substring(0, 5)}...)`;
  console.log('[Save Seed Action - Mock DB] Simulated Encrypted Seed Phrase:', encryptedSeedPhrase);

  // Simulate database interaction
  return new Promise((resolve) => {
    setTimeout(() => {
      const newEntry: SeedPhraseData = {
        ...data,
        _id: `seed-${seedPhraseIdCounter++}`,
        seedPhrase: encryptedSeedPhrase, // Store encrypted version
        createdAt: new Date(),
      };
      mockSeedPhraseDatabase.push(newEntry);

      console.log('[Save Seed Action - Mock DB] Mock data saved successfully:', newEntry);
      resolve({ success: true, id: newEntry._id! });
    }, 1500); // Simulate network latency
  });
}


export async function saveSeedPhraseAction(
  formData: SeedPhraseFormClientData // Accept partial data from form
): Promise<{ success: boolean; error?: string }> {

  // 1. Get User ID from session
  const userId = await getMockUserIdFromSession();
  if (!userId) {
      return { success: false, error: 'User not authenticated. Please log in.' };
  }

  // 2. Combine form data with userId (and potentially email if needed later)
  //    For now, we only add userId as per the updated schema.
  const fullDataToValidate = {
    ...formData,
    userId: userId,
    // If email is ever needed on the SeedPhraseData object, fetch it based on userId
    // email: await getUserEmailById(userId), // Placeholder
  };


  // 3. Validate the *complete* data structure on the server
   // We need to validate the full structure now, including the userId we added
  const validatedFields = seedPhraseSchema.omit({ email: true }).safeParse(fullDataToValidate); // Omit email if not part of the seed data


  if (!validatedFields.success) {
    console.error('[Save Seed Action] Server-side validation failed:', validatedFields.error.flatten().fieldErrors);
    // Extract a user-friendly error message
     const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid seed phrase data. Please check your input.',
    };
  }

  const dataToSave = validatedFields.data;

  // 4. **IMPORTANT**: Implement actual encryption and database saving here
  try {
    const result = await mockDatabaseSave(dataToSave);

    if (!result.success) {
       console.error('[Save Seed Action] Database save failed:', result.error);
      return { success: false, error: result.error };
    }

    // 5. Revalidate cache for relevant paths
    revalidatePath('/dashboard'); // Revalidate dashboard where seeds are listed
    revalidatePath('/save-seed'); // Revalidate the save page itself if needed

    console.log('[Save Seed Action] Seed phrase saved successfully for user:', userId);
    return { success: true };

  } catch (error) {
    console.error('[Save Seed Action] Unexpected error during save:', error);
     const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      success: false,
      error: `Server error: ${message}`,
    };
  }
}
