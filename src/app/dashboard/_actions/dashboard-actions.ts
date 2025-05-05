
'use server';

import {
    seedPhraseMetadataSchema,
    revealedSeedPhraseSchema // Use the updated schema for plain text
} from '@/lib/definitions';
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies
import { z } from 'zod';
import { revalidatePath } from 'next/cache'; // Import revalidatePath for delete
import { verifyAuth } from '@/lib/auth/utils'; // Import verifyAuth for basic check

// Use the standard backend URL variable
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
const COOKIE_NAME = 'session'; // Consistent cookie name

if (!BACKEND_API_URL) {
    console.warn('Warning: BACKEND_API_URL environment variable is not defined. Using default http://localhost:3001');
}

// Helper function to get the auth token
function getAuthToken(): string | undefined {
    return cookies().get(COOKIE_NAME)?.value;
}

// Action to get the authenticated user's seed phrase metadata
export async function getSeedPhraseMetadataAction(): Promise<{ phrases?: SeedPhraseMetadata[]; error?: string }> {
    const token = getAuthToken();
    if (!token) {
        console.warn('[Get Metadata Action] No auth token found.');
        return { error: 'Authentication required. Please log in.' };
    }

    try {
        console.log(`[Get Metadata Action] Fetching metadata from backend: ${BACKEND_API_URL}/api/seed-phrases/metadata`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/metadata`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            let errorMessage = `Failed to fetch metadata (status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || errorMessage;
                 console.error('[Get Metadata Action] Backend error:', { status: response.status, errorData });
                 if (response.status === 401 || response.status === 403) {
                      errorMessage = 'Authentication failed. Please log in again.';
                 }
             } catch (e) {
                 console.error('[Get Metadata Action] Failed to fetch metadata, could not parse error response:', response.status, response.statusText);
                 errorMessage = `Failed to fetch metadata: ${response.statusText || 'Unknown server error'}`;
                 if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
             }
            return { error: errorMessage };
        }

        const data = await response.json();
        const validatedData = z.array(seedPhraseMetadataSchema).safeParse(data);

        if (!validatedData.success) {
             console.error("[Get Metadata Action] Dashboard Data Validation Error:", validatedData.error.flatten());
             return { error: 'Received invalid data format from the server.' };
        }

        return { phrases: validatedData.data };

    } catch (error) {
        console.error('[Get Metadata Action] Network or unexpected error:', error);
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { error: `Failed to fetch metadata: ${detailedError}` };
    }
}

// Action to reveal the plain text details of a specific seed phrase by its ID (requires auth)
export async function revealSeedPhraseAction(phraseId: string): Promise<{ data?: RevealedSeedPhraseData; error?: string }> {
    const token = getAuthToken();
    if (!token) {
         console.warn('[Reveal Action] No auth token found.');
        return { error: 'Authentication required. Please log in.' };
    }

    if (!phraseId || typeof phraseId !== 'string') {
        return { error: 'Invalid Phrase ID provided.'};
    }

    try {
         console.log(`[Reveal Action - Plain Text] Sending reveal request for Phrase ID: ${phraseId} to ${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`);
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
                 console.error('[Reveal Action - Plain Text] Backend error:', { status: response.status, errorData, phraseId });
                  if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
                  if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
             } catch (e) {
                  console.error('[Reveal Action - Plain Text] Failed to reveal data, could not parse error response:', response.status, response.statusText, phraseId);
                 errorMessage = `Failed to reveal data: ${response.statusText || 'Unknown server error'}`;
                  if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
                  if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
             }
             return { error: errorMessage };
        }

        const data = await response.json();

        // Validate the revealed data against the updated plain text reveal schema
        const validatedData = revealedSeedPhraseSchema.safeParse(data);

        if (!validatedData.success) {
             console.error("[Reveal Action - Plain Text] Reveal Data Validation Error:", validatedData.error.flatten(), { phraseId });
             return { error: 'Received invalid data format from server.' };
        }

        return { data: validatedData.data }; // Return plain text data

    } catch (error) {
        console.error(`[Reveal Action - Plain Text] Network or unexpected error for Phrase ID: ${phraseId}`, error);
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { error: `Failed to reveal data: ${detailedError}` };
    }
}


// Action to delete a seed phrase entry by its ID (requires auth)
export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
     const token = getAuthToken();
     if (!token) {
          console.warn('[Delete Action] No auth token found.');
         return { success: false, error: 'Authentication required. Please log in.' };
     }

    if (!phraseId || typeof phraseId !== 'string') {
        return { success: false, error: 'Invalid Phrase ID provided.'};
    }

    try {
         console.warn(`[Delete Action] Sending HARD DELETE request for Phrase ID: ${phraseId} to ${BACKEND_API_URL}/api/seed-phrases/${phraseId}`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            let errorMessage = `Failed to delete (status: ${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || (response.status === 404 ? 'Seed phrase not found or access denied.' : errorMessage);
                console.error('[Delete Action] Backend error:', { status: response.status, errorData, phraseId });
                 if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
                 if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
            } catch (e) {
                 console.error('[Delete Action] Failed to delete, could not parse error response:', response.status, response.statusText, phraseId);
                errorMessage = `Failed to delete: ${response.statusText || 'Unknown server error'}`;
                 if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
                 if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
            }
            return { success: false, error: errorMessage };
        }

        console.log(`[Delete Action] Deletion successful for Phrase ID: ${phraseId}. Revalidating dashboard.`);
        revalidatePath('/dashboard'); // Revalidate the dashboard path to reflect the deletion
        return { success: true };

    } catch (error) {
        console.error(`[Delete Action] Network or unexpected error for Phrase ID: ${phraseId}`, error);
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { success: false, error: `Failed to delete seed phrase: ${detailedError}` };
    }
}
