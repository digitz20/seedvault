'use server';

import { seedPhraseSchema } from '@/lib/definitions';
import type { SeedPhraseFormData, SeedPhraseData } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getSeedPhrasesCollection, getUsersCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
// IMPORTANT: Add a real encryption library (e.g., crypto-js, Node's crypto)
// For this example, we'll use a placeholder "encryption".
// import crypto from 'crypto'; // Example using Node's built-in crypto

// --- Placeholder Encryption ---
// Replace with robust, authenticated encryption (e.g., AES-GCM)
// Store the key securely (e.g., environment variable, secrets manager)
const ENCRYPTION_KEY = process.env.SEED_ENCRYPTION_KEY || 'default-very-insecure-key-32-bytes'; // MUST be 32 bytes for AES-256
const IV_LENGTH = 16; // For AES, this is always 16

if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY === 'default-very-insecure-key-32-bytes') {
    console.warn('WARNING: Using default insecure encryption key in production!');
}
if (Buffer.from(ENCRYPTION_KEY, 'utf8').length !== 32) {
    console.error('FATAL: SEED_ENCRYPTION_KEY must be 32 bytes long.');
    // In a real app, you might throw an error here or prevent startup
}

function encrypt(text: string): string {
    // --- !!! ---
    // THIS IS A PLACEHOLDER - DO NOT USE IN PRODUCTION
    // Use Node's crypto module or a library like crypto-js for real encryption
    // --- !!! ---
    // Example using simple Base64 encoding as a stand-in
     try {
        return Buffer.from(text).toString('base64');
        // --- Real Encryption Example (Conceptual) ---
        // const iv = crypto.randomBytes(IV_LENGTH);
        // const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
        // let encrypted = cipher.update(text, 'utf8', 'hex');
        // encrypted += cipher.final('hex');
        // const authTag = cipher.getAuthTag();
        // // Combine IV, authTag, and encrypted data (e.g., IV:AuthTag:EncryptedData)
        // return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        // --- End Real Encryption Example ---
     } catch (e) {
        console.error("Encryption failed:", e);
        throw new Error("Could not encrypt seed phrase.");
     }

}
// Add a corresponding decrypt function in the component that displays the seed phrase
// --- End Placeholder Encryption ---


// --- Session Retrieval ---
async function getUserIdFromSession(): Promise<ObjectId | null> {
  const sessionId = cookies().get('session_id')?.value;
  if (!sessionId || !sessionId.startsWith('session-')) {
      console.warn('[Save Seed Action] No valid session found.');
      return null;
  }

  // Extract userId string
  const userIdString = sessionId.split('-')[1];
   if (!userIdString) {
      console.error('[Save Seed Action] Could not extract userId from session:', sessionId);
      return null;
  }

  console.log('[Save Seed Action] Extracted userIdString:', userIdString);

  // Convert to ObjectId
  try {
      const userId = new ObjectId(userIdString);
      console.log('[Save Seed Action] Converted to ObjectId:', userId);

       // Optional: Verify user exists in DB
      // const usersCollection = await getUsersCollection();
      // const userExists = await usersCollection.countDocuments({ _id: userId });
      // if (userExists === 0) {
      //   console.warn('[Save Seed Action] User ID from session not found in DB:', userId);
      //   // Clear invalid cookie?
      //   // cookies().delete('session_id');
      //   return null;
      // }

      return userId;
  } catch (e) {
      console.error('[Save Seed Action] Invalid userId format in session:', userIdString, e);
      // Clear invalid cookie?
      // cookies().delete('session_id');
      return null;
  }
}
// ----------------------------


// --- Database Save Logic ---
async function databaseSave(data: Omit<SeedPhraseData, '_id' | 'createdAt'>): Promise<{ success: true; id: string } | { success: false; error: string }> {
  console.log('[Save Seed Action - DB] Received data:', { ...data, seedPhrase: '***' }); // Don't log raw seed

  // Encrypt the seed phrase before saving
  let encryptedSeedPhrase: string;
  try {
      encryptedSeedPhrase = encrypt(data.seedPhrase);
      console.log('[Save Seed Action - DB] Seed phrase encrypted.');
  } catch (encError: any) {
      console.error('[Save Seed Action - DB] Encryption failed:', encError);
      return { success: false, error: 'Failed to secure seed phrase before saving.' };
  }


  try {
      const seedPhrasesCollection = await getSeedPhrasesCollection();

      const newEntry: Omit<SeedPhraseData, '_id'> = {
          ...data,
          seedPhrase: encryptedSeedPhrase, // Store the encrypted version
          createdAt: new Date(),
          // Ensure userId is an ObjectId
          userId: new ObjectId(data.userId)
      };

      const result = await seedPhrasesCollection.insertOne(newEntry as SeedPhraseData); // Cast needed as insertOne expects the full type

      if (!result.insertedId) {
          console.error('[Save Seed Action - DB] Insertion failed.');
          return { success: false, error: 'Failed to save seed phrase to database.' };
      }

      const insertedIdString = result.insertedId.toString();
      console.log('[Save Seed Action - DB] Seed phrase saved successfully:', insertedIdString);
      return { success: true, id: insertedIdString };

  } catch (error) {
      console.error('[Save Seed Action - DB] Error saving seed phrase:', error);
      return { success: false, error: 'Database error saving seed phrase.' };
  }
}


export async function saveSeedPhraseAction(
  formData: Omit<SeedPhraseFormData, 'userId'> // Expect form data without userId
): Promise<{ success: boolean; error?: string }> {

  // 1. Get User ID from session
  const userId = await getUserIdFromSession();
  if (!userId) {
      return { success: false, error: 'User not authenticated. Please log in.' };
  }

  // 2. Combine form data with userId (as ObjectId)
  const fullDataToValidate = {
    ...formData,
    userId: userId, // Use the ObjectId retrieved from the session
  };

  // 3. Validate the *complete* data structure on the server
  const validatedFields = seedPhraseSchema.safeParse(fullDataToValidate);

  if (!validatedFields.success) {
    console.error('[Save Seed Action] Server-side validation failed:', validatedFields.error.flatten().fieldErrors);
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return {
      success: false,
      error: firstError || 'Invalid seed phrase data. Please check your input.',
    };
  }

  // Type assertion after validation
  const dataToSave = validatedFields.data as Omit<SeedPhraseData, '_id' | 'createdAt'>;


  // 4. Encrypt and save to database
  try {
    const result = await databaseSave(dataToSave);

    if (!result.success) {
       // Error logged within databaseSave
      return { success: false, error: result.error };
    }

    // 5. Revalidate cache for relevant paths
    revalidatePath('/dashboard'); // Revalidate dashboard where seeds are listed

    console.log('[Save Seed Action] Seed phrase saved successfully for user:', userId.toString());
    return { success: true };

  } catch (error) {
     // Catch unexpected errors not handled within databaseSave
    console.error('[Save Seed Action] Unexpected error during save:', error);
     const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      success: false,
      // Be cautious about exposing details
      error: `Server error: ${message}`,
    };
  }
}
