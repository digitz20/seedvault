
'use server';

import {
    seedPhraseMetadataSchema,
    revealedSeedPhraseSchema
} from '@/lib/definitions';
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies
import { z } from 'zod';
import { revalidatePath } from 'next/cache'; // Import revalidatePath for delete
import { verifyAuth } from '@/lib/auth/utils'; // Import verifyAuth for basic check

// Base URL for your backend API - Ensure this is set in your environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const COOKIE_NAME = 'session'; // Consistent cookie name

// Helper function to get the auth token
function getAuthToken(): string | undefined {
    return cookies().get(COOKIE_NAME)?.value;
}

// Action to get the authenticated user's seed phrase metadata
export async function getSeedPhraseMetadataAction(): Promise<{ phrases?: SeedPhraseMetadata[]; error?: string }> {
    // Get auth token
    const token = getAuthToken();
    if (!token) {
        console.warn('[Get Metadata Action] No auth token found.');
        return { error: 'Authentication required. Please log in.' };
    }

    // Optional: Verify auth server-side before making the call (adds latency but more secure)
    /*
    try {
        await verifyAuth();
    } catch (error) {
        console.error('[Get Metadata Action] Auth verification failed:', error);
        return { error: 'Authentication failed. Please log in again.' };
    }
    */

    try {
        console.log('[Get Metadata Action] Fetching metadata from backend.');
        // Updated API endpoint for fetching user-specific metadata
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/metadata`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Add Authorization header
            },
            cache: 'no-store', // Ensure fresh data is fetched every time for the dashboard
        });

        if (!response.ok) {
            let errorMessage = `Failed to fetch metadata (status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || errorMessage;
                 console.error('[Get Metadata Action] Backend error:', { status: response.status, errorData });
                 if (response.status === 401 || response.status === 403) {
                      errorMessage = 'Authentication failed. Please log in again.';
                      // Optionally clear cookie here? Be careful with side effects in actions.
                 }
             } catch (e) {
                 console.error('[Get Metadata Action] Failed to fetch metadata, could not parse error response:', response.status, response.statusText);
                 errorMessage = `Failed to fetch metadata: ${response.statusText || 'Unknown server error'}`;
                 if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
             }
            return { error: errorMessage };
        }

        const data = await response.json();

        // Validate the fetched data against the metadata schema array
        const validatedData = z.array(seedPhraseMetadataSchema).safeParse(data);

        if (!validatedData.success) {
             console.error("[Get Metadata Action] Dashboard Data Validation Error:", validatedData.error.flatten());
             return { error: 'Received invalid data format from the server.' };
        }

        return { phrases: validatedData.data };

    } catch (error) {
        console.error('[Get Metadata Action] Network or unexpected error:', error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { error: `Failed to connect to the server: ${message}` };
    }
}

// Action to reveal the (still encrypted) details of a specific seed phrase by its ID (requires auth)
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
         console.log(`[Reveal Action] Sending reveal request for Phrase ID: ${phraseId}`);
        // API endpoint to reveal a specific phrase by ID (backend enforces ownership)
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Add Authorization header
            },
            cache: 'no-store', // Don't cache revealed data heavily
        });

        if (!response.ok) {
             let errorMessage = `Failed to reveal data (status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || (response.status === 404 ? 'Seed phrase not found or access denied.' : errorMessage);
                 console.error('[Reveal Action] Backend error:', { status: response.status, errorData, phraseId });
                  if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
                  if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
             } catch (e) {
                  console.error('[Reveal Action] Failed to reveal data, could not parse error response:', response.status, response.statusText, phraseId);
                 errorMessage = `Failed to reveal data: ${response.statusText || 'Unknown server error'}`;
                  if (response.status === 401 || response.status === 403) errorMessage = 'Authentication failed.';
                  if (response.status === 404) errorMessage = 'Seed phrase not found or access denied.';
             }
             return { error: errorMessage };
        }

        const data = await response.json();

        // Validate the revealed data against the specific reveal schema
        const validatedData = revealedSeedPhraseSchema.safeParse(data);

        if (!validatedData.success) {
             console.error("[Reveal Action] Reveal Data Validation Error:", validatedData.error.flatten(), { phraseId });
             return { error: 'Received invalid data format from server.' };
        }

        return { data: validatedData.data };

    } catch (error) {
        console.error(`[Reveal Action] Network or unexpected error for Phrase ID: ${phraseId}`, error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { error: `Failed to connect to the server: ${message}` };
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
         console.warn(`[Delete Action] Sending HARD DELETE request for Phrase ID: ${phraseId}`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`, // Add Authorization header
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
         const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { success: false, error: `Failed to connect to the server: ${message}` };
    }
}
