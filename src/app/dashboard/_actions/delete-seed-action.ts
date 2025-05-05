'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSeedPhrasesCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// --- Session Retrieval ---
// (Similar to save-seed-action, ensures only the owner can delete)
async function getUserIdFromSession(): Promise<ObjectId | null> {
  const sessionId = cookies().get('session_id')?.value;
  if (!sessionId || !sessionId.startsWith('session-')) {
    console.warn('[Delete Seed Action] No valid session found.');
    return null;
  }
  const userIdString = sessionId.split('-')[1];
   if (!userIdString) {
      console.error('[Delete Seed Action] Could not extract userId from session:', sessionId);
      return null;
  }
  try {
    // Basic check if user exists might be good here too, but less critical than save
    return new ObjectId(userIdString);
  } catch (e) {
    console.error('[Delete Seed Action] Invalid userId format in session:', userIdString, e);
    return null;
  }
}

export async function deleteSeedPhraseAction(
  seedPhraseId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('[Delete Seed Action] Attempting to delete seed phrase ID:', seedPhraseId);

  // 1. Get User ID from session
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  // 2. Validate seedPhraseId format
  let objectIdToDelete: ObjectId;
  try {
    objectIdToDelete = new ObjectId(seedPhraseId);
  } catch (e) {
    console.error('[Delete Seed Action] Invalid seedPhraseId format:', seedPhraseId, e);
    return { success: false, error: 'Invalid seed phrase identifier.' };
  }

  // 3. Perform Database Deletion
  try {
    const seedPhrasesCollection = await getSeedPhrasesCollection();

    // IMPORTANT: Delete only if the userId matches the logged-in user
    const result = await seedPhrasesCollection.deleteOne({
      _id: objectIdToDelete,
      userId: userId, // Ensure the user owns this record
    });

    if (result.deletedCount === 1) {
      console.log('[Delete Seed Action] Seed phrase deleted successfully:', seedPhraseId);
      revalidatePath('/dashboard'); // Revalidate the dashboard page cache
      return { success: true };
    } else {
      console.warn('[Delete Seed Action] Seed phrase not found or user mismatch for ID:', seedPhraseId, 'User:', userId.toString());
      // Could be because ID doesn't exist, or user doesn't own it. Keep error generic.
      return { success: false, error: 'Seed phrase not found or permission denied.' };
    }
  } catch (error) {
    console.error('[Delete Seed Action] Database error during deletion:', error);
    return { success: false, error: 'Database error deleting seed phrase.' };
  }
}
