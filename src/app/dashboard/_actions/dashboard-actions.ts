
'use server';

import {
    seedPhraseMetadataSchema,
    revealedSeedPhraseSchema // Use the updated schema for plain text
} from '@/lib/definitions';
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies
import { z } from 'zod';
<<<<<<< HEAD
<<<<<<< HEAD
import { revalidatePath } from 'next/cache'; // Import revalidatePath for delete
import { verifyAuth } from '@/lib/auth/utils'; // Import verifyAuth for rigorous check
=======
import { revalidatePath } from 'next/cache'; // Keep revalidatePath if needed elsewhere
// Import verifyAuth for rigorous check (verifyAuth only, getSession is internal)
import { verifyAuth } from '@/lib/auth/utils';
>>>>>>> b0e566c (dont show the deleted seedphrase on the dashboard but still keep it in the database)
=======
import { revalidatePath } from 'next/cache'; // Keep revalidatePath if needed elsewhere
// Import verifyAuth for rigorous check (verifyAuth only, getSession is internal)
import { verifyAuth } from '@/lib/auth/utils';
>>>>>>> b0e566c (dont show the deleted seedphrase on the dashboard but still keep it in the database)

// Use the standard backend URL variable
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const COOKIE_NAME = 'session'; // Consistent cookie name

if (!BACKEND_API_URL) {
    console.warn('Warning: BACKEND_API_URL environment variable is not defined. Using default http://localhost:3001');
}

// Helper function to get the auth token (used after verifyAuth confirms session)
function getAuthToken(): string | undefined {
    return cookies().get(COOKIE_NAME)?.value;
}

// Action to get the authenticated user's seed phrase metadata
export async function getSeedPhraseMetadataAction(): Promise<{ phrases?: SeedPhraseMetadata[]; error?: string }> {
    console.log("[Get Metadata Action] Starting..."); // Log start of action
    console.time('[Get Metadata Action] Total Duration'); // Start overall timer
    let userId: string;
    let userEmail: string; // Added to log email as well
    let token: string | undefined;

    // 1. Initial Authentication Check
    try {
        console.time('[Get Metadata Action] verifyAuth'); // Start verifyAuth timer
        const user = await verifyAuth(); // Throws if not authenticated
        console.timeEnd('[Get Metadata Action] verifyAuth'); // End verifyAuth timer
        userId = user.userId;
        userEmail = user.email; // Get email from verified user data
        token = getAuthToken();
        if (!token) {
            // This case is unlikely if verifyAuth succeeded, but handles edge cases
            throw new Error('Session token missing after successful verification.');
        }
        // Log the user ID and email being used for the request
        console.log(`[Get Metadata Action] Authentication verified for User ID: ${userId}, Email: ${userEmail}. Proceeding to fetch data.`);
    } catch (error: any) {
        console.timeEnd('[Get Metadata Action] verifyAuth'); // Ensure timer ends on error
        console.error('[Get Metadata Action] verifyAuth failed:', error.message);
        console.timeEnd('[Get Metadata Action] Total Duration'); // End overall timer on error
        return { error: 'Authentication required. Please log in.' };
    }

    // 2. Fetch Data
    try {
         // Log the specific endpoint being called
        console.log(`[Get Metadata Action] Fetching metadata from backend: ${BACKEND_API_URL}/api/seed-phrases/metadata for User ID: ${userId}`);
        console.time('[Get Metadata Action] Fetch API Call'); // Start fetch timer
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/metadata`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Send the user's token
            },
            cache: 'no-store', // Ensure fresh data
        });
        console.timeEnd('[Get Metadata Action] Fetch API Call'); // End fetch timer
         console.log(`[Get Metadata Action] Fetch API status for User ID ${userId}: ${response.status}`); // Log status

        if (!response.ok) {
            let errorMessage = `Failed to fetch metadata (status: ${response.status})`;
            console.time('[Get Metadata Action] Parse Error Response JSON'); // Start error parse timer
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || errorMessage;
                 console.error('[Get Metadata Action] Backend error:', { status: response.status, errorData, userId, userEmail }); // Include email in error log
                 if (response.status === 401 || response.status === 403) {
                      // This indicates a token issue despite verifyAuth passing - maybe backend state changed?
                      errorMessage = 'Authentication issue fetching data. Please log in again.';
                 }
             } catch (e) {
                 console.error('[Get Metadata Action] Failed to fetch metadata, could not parse error response:', response.status, response.statusText, userId, userEmail); // Include email
                 errorMessage = `Failed to fetch metadata: ${response.statusText || 'Unknown server error'}`;
                 if (response.status === 401 || response.status === 403) errorMessage = 'Authentication issue fetching data.';
             }
             console.timeEnd('[Get Metadata Action] Parse Error Response JSON'); // End error parse timer
             console.log(`[Get Metadata Action] Returning error for User ID ${userId}: `, errorMessage); // Log return
             console.timeEnd('[Get Metadata Action] Total Duration'); // End overall timer on error
            return { error: errorMessage };
        }

        console.time('[Get Metadata Action] Parse Success Response JSON'); // Start success parse timer
        const data = await response.json();
        console.timeEnd('[Get Metadata Action] Parse Success Response JSON'); // End success parse timer

        console.time('[Get Metadata Action] Data Validation'); // Start validation timer
        const validatedData = z.array(seedPhraseMetadataSchema).safeParse(data);
        console.timeEnd('[Get Metadata Action] Data Validation'); // End validation timer

        if (!validatedData.success) {
             console.error("[Get Metadata Action] Dashboard Data Validation Error:", validatedData.error.flatten(), { userId, userEmail }); // Include email
              console.log(`[Get Metadata Action] Returning validation error for User ID ${userId}.`); // Log return
             console.timeEnd('[Get Metadata Action] Total Duration'); // End overall timer on error
             return { error: 'Received invalid data format from the server.' };
        }
        // Log success with count
        console.log(`[Get Metadata Action] Successfully fetched ${validatedData.data.length} phrases for User ID: ${userId}, Email: ${userEmail}. Returning success.`);
        console.timeEnd('[Get Metadata Action] Total Duration'); // End overall timer on success
        return { phrases: validatedData.data };

    } catch (error) {
        console.error(`[Get Metadata Action] Network or unexpected error for User ID: ${userId}, Email: ${userEmail}`, error); // Include email
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
          console.log(`[Get Metadata Action] Returning network/unexpected error for User ID ${userId}: `, detailedError); // Log return
         console.timeEnd('[Get Metadata Action] Total Duration'); // End overall timer on error
        return { error: `Failed to fetch metadata: ${detailedError}` };
    }
}

// Action to reveal the plain text details of a specific seed phrase by its ID (requires auth)
export async function revealSeedPhraseAction(phraseId: string): Promise<{ data?: RevealedSeedPhraseData; error?: string }> {
    let userId: string;
    let userEmail: string;
    let token: string | undefined;

    // 1. Initial Authentication Check
    try {
        const user = await verifyAuth();
        userId = user.userId;
        userEmail = user.email;
        token = getAuthToken();
        if (!token) throw new Error('Session token missing after successful verification.');
        console.log(`[Reveal Action] Authentication verified for User ID: ${userId}, Email: ${userEmail}, Phrase ID: ${phraseId}`);
    } catch (error: any) {
        console.error(`[Reveal Action] verifyAuth failed for Phrase ID ${phraseId}:`, error.message);
        return { error: 'Authentication required. Please log in.' };
    }

    if (!phraseId || typeof phraseId !== 'string') {
        return { error: 'Invalid Phrase ID provided.'};
    }

    // 2. Fetch Reveal Data
    try {
         console.log(`[Reveal Action - Plain Text] Sending reveal request for Phrase ID: ${phraseId} to ${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal (User: ${userId})`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
             let errorMessage = `Failed to reveal data (status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || (response.status === 404 ? 'Seed phrase not found or access denied.' : errorMessage);
                 console.error('[Reveal Action - Plain Text] Backend error:', { status: response.status, errorData, phraseId, userId, userEmail }); // Include email
                  if (response.status === 401 || response.status === 403) errorMessage = 'Authentication issue revealing data.';
                  if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
             } catch (e) {
                  console.error('[Reveal Action - Plain Text] Failed to reveal data, could not parse error response:', response.status, response.statusText, phraseId, userId, userEmail); // Include email
                 errorMessage = `Failed to reveal data: ${response.statusText || 'Unknown server error'}`;
                  if (response.status === 401 || response.status === 403) errorMessage = 'Authentication issue revealing data.';
                  if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
             }
             return { error: errorMessage };
        }

        const data = await response.json();

        // Validate the revealed data against the updated plain text reveal schema
        const validatedData = revealedSeedPhraseSchema.safeParse(data);

        if (!validatedData.success) {
             console.error("[Reveal Action - Plain Text] Reveal Data Validation Error:", validatedData.error.flatten(), { phraseId, userId, userEmail }); // Include email
             return { error: 'Received invalid data format from server.' };
        }
         console.log(`[Reveal Action] Successfully revealed data for Phrase ID: ${phraseId}, User ID: ${userId}, Email: ${userEmail}`); // Include email
        return { data: validatedData.data }; // Return plain text data

    } catch (error) {
        console.error(`[Reveal Action - Plain Text] Network or unexpected error for Phrase ID: ${phraseId}, User ID: ${userId}, Email: ${userEmail}`, error); // Include email
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { error: `Failed to reveal data: ${detailedError}` };
    }
}


<<<<<<< HEAD
<<<<<<< HEAD
// Action to "delete" a seed phrase entry by its ID (only updates frontend state)
export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
     let userId: string;
     let userEmail: string;

     // 1. Initial Authentication Check (still good practice to verify ownership)
     try {
         const user = await verifyAuth();
         userId = user.userId;
         userEmail = user.email;
         console.log(`[Delete Action - Simulated] Request by User ID: ${userId}, Email: ${userEmail} for Phrase ID: ${phraseId}`);
     } catch (error: any) {
         console.error(`[Delete Action - Simulated] verifyAuth failed for Phrase ID ${phraseId}:`, error.message);
         return { success: false, error: 'Authentication required. Please log in.' };
     }

    if (!phraseId || typeof phraseId !== 'string') {
        return { success: false, error: 'Invalid Phrase ID provided.'};
    }

    // 2. Simulate Success (No Backend Call)
    console.log(`[Delete Action - Simulated] SIMULATING deletion for Phrase ID: ${phraseId}. No database interaction.`);

    // Immediately return success to allow the frontend to update the UI
    // RevalidatePath is still useful if the underlying data *could* change through other means,
    // but technically not needed if ONLY this action modifies the list being displayed.
    // Let's keep it for potential future changes.
    revalidatePath('/dashboard');
    return { success: true };

     // --- REMOVED BACKEND FETCH CALL ---
    /*
    try {
         console.log(`[Delete Action] Sending HARD DELETE request for Phrase ID: ${phraseId} to ${BACKEND_API_URL}/api/seed-phrases/${phraseId} (User: ${userId})`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`, // Token needed for backend auth
            },
        });

        if (!response.ok) {
            // ... error handling ...
            return { success: false, error: errorMessage };
        }

        console.log(`[Delete Action] Deletion successful for Phrase ID: ${phraseId}, User ID: ${userId}, Email: ${userEmail}. Revalidating dashboard.`); // Include email
        revalidatePath('/dashboard'); // Revalidate the dashboard path to reflect the deletion
        return { success: true };

    } catch (error) {
        // ... error handling ...
        return { success: false, error: `Failed to delete seed phrase: ${detailedError}` };
    }
    */
=======
// REMOVED deleteSeedPhraseAction as deletion is handled locally in the UI
/*
export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
     // ... implementation removed ...
>>>>>>> b0e566c (dont show the deleted seedphrase on the dashboard but still keep it in the database)
=======
// REMOVED deleteSeedPhraseAction as deletion is handled locally in the UI
/*
export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
     // ... implementation removed ...
>>>>>>> b0e566c (dont show the deleted seedphrase on the dashboard but still keep it in the database)
}
*/
