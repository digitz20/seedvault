'use server';

import type { SeedPhraseFormData } from '@/lib/definitions';
import { seedPhraseSchema } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

// Placeholder for actual database interaction and encryption logic.
// In a real application, you would:
// 1. Connect to your MongoDB database.
// 2. Encrypt the seedPhrase using a strong, standard encryption library (e.g., crypto module in Node.js or a dedicated library).
//    NEVER store the seed phrase in plain text.
// 3. Store the email, walletName, walletType, and the *encrypted* seedPhrase in the database.
// 4. Implement proper error handling for database operations and encryption.
// 5. Consider how decryption will be handled securely when the user needs to retrieve the phrase (e.g., requiring the user's password).

async function mockDatabaseSave(data: SeedPhraseFormData): Promise<{ success: true } | { success: false, error: string }> {
  console.log('[Server Action] Received data:', data);

  // Simulate encryption (replace with actual encryption)
  const encryptedSeedPhrase = `encrypted(${data.seedPhrase.substring(0, 5)}...)`;
  console.log('[Server Action] Simulated Encrypted Seed Phrase:', encryptedSeedPhrase);

  // Simulate database interaction
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate potential database error (uncomment to test error handling)
      // if (Math.random() > 0.7) {
      //   console.error('[Server Action] Mock Database Error');
      //   return resolve({ success: false, error: 'Failed to save to the database.' });
      // }

      console.log('[Server Action] Mock data saved successfully:', {
        email: data.email,
        walletName: data.walletName,
        walletType: data.walletType,
        encryptedSeedPhrase: encryptedSeedPhrase, // Store encrypted version
        createdAt: new Date(),
      });
      resolve({ success: true });
    }, 1500); // Simulate network latency
  });
}


export async function saveSeedPhraseAction(
  formData: SeedPhraseFormData // Accept validated data directly
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate data on the server (belt-and-suspenders approach)
  const validatedFields = seedPhraseSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('[Server Action] Server-side validation failed:', validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      error: 'Invalid data received. Please check your input.',
      // You could potentially return more specific errors:
      // error: JSON.stringify(validatedFields.error.flatten().fieldErrors),
    };
  }

  const dataToSave = validatedFields.data;

  // 2. **IMPORTANT**: Implement actual encryption and database saving here
  try {
     // WARNING: The emailPassword field is NOT included here. Collecting and storing
     // email passwords is a major security risk. If needed for a specific backend
     // integration (like automated checking, which is complex and risky), handle
     // it with extreme care, separate authentication flows, and strong encryption,
     // never storing it alongside the seed phrase if possible.
    const result = await mockDatabaseSave(dataToSave);

    if (!result.success) {
       console.error('[Server Action] Database save failed:', result.error);
      return { success: false, error: result.error };
    }

    // 3. Revalidate cache if needed (e.g., if displaying saved entries elsewhere)
    revalidatePath('/save-seed'); // Or any path that might display saved data
    revalidatePath('/'); // Revalidate homepage if needed

    console.log('[Server Action] Seed phrase saved successfully for:', dataToSave.email);
    return { success: true };

  } catch (error) {
    console.error('[Server Action] Unexpected error during save:', error);
     const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return {
      success: false,
      error: `Server error: ${message}`,
    };
  }
}
