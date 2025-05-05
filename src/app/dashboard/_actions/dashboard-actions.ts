
'use server';

import {
    seedPhraseMetadataSchema,
    revealedSeedPhraseSchema
} from '@/lib/definitions';
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from '@/lib/definitions';
// Removed cookies import
import { z } from 'zod';
// Removed revalidatePath import as it's only used for delete

// Base URL for your backend API - Ensure this is set in your environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// Action to get ALL seed phrase metadata for the public dashboard list
export async function getSeedPhraseMetadataAction(): Promise<{ phrases?: SeedPhraseMetadata[]; error?: string }> {
    // Removed token retrieval

    try {
        // Updated API endpoint for fetching all public metadata
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/metadata`, {
            method: 'GET',
            headers: {
                // No Authorization header needed
            },
            cache: 'no-store', // Ensure fresh data is fetched every time for the dashboard
        });

        if (!response.ok) {
            let errorMessage = `Failed to fetch metadata (status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || errorMessage;
                 console.error('[Get Metadata Action] Backend error:', { status: response.status, errorData });
             } catch (e) {
                 console.error('[Get Metadata Action] Failed to fetch metadata, could not parse error response:', response.status, response.statusText);
                 errorMessage = `Failed to fetch metadata: ${response.statusText || 'Unknown server error'}`;
             }
            return { error: errorMessage };
        }

        const data = await response.json();

        // Validate the fetched data against the metadata schema array
        const validatedData = z.array(seedPhraseMetadataSchema).safeParse(data);

        if (!validatedData.success) {
             console.error("[Get Metadata Action] Dashboard Data Validation Error:", validatedData.error.flatten());
             // Provide a user-friendly error message
             return { error: 'Received invalid data format from the server. Could not display phrases.' };
        }

        // Return the validated metadata array
        return { phrases: validatedData.data };

    } catch (error) {
        // Handle network errors or other unexpected issues
        console.error('[Get Metadata Action] Network or unexpected error:', error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { error: `Failed to connect to the server to fetch seed phrases: ${message}` };
    }
}

// Action to reveal the (still encrypted) details of a specific seed phrase by its ID (public access)
export async function revealSeedPhraseAction(phraseId: string): Promise<{ data?: RevealedSeedPhraseData; error?: string }> {
    // Removed token retrieval

    if (!phraseId || typeof phraseId !== 'string') {
        return { error: 'Invalid Phrase ID provided.'}
    }

    try {
        // API endpoint to reveal a specific phrase by ID
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`, {
            method: 'GET',
            headers: {
                // No Authorization header needed
            },
            cache: 'no-store', // Don't cache revealed data heavily
        });

        if (!response.ok) {
             let errorMessage = `Failed to reveal data (status: ${response.status})`;
             try {
                 const errorData = await response.json();
                 errorMessage = errorData.message || (response.status === 404 ? 'Seed phrase not found.' : errorMessage);
                 console.error('[Reveal Action] Backend error:', { status: response.status, errorData, phraseId });
             } catch (e) {
                  console.error('[Reveal Action] Failed to reveal data, could not parse error response:', response.status, response.statusText, phraseId);
                 errorMessage = `Failed to reveal data: ${response.statusText || 'Unknown server error'}`;
                  if (response.status === 404) errorMessage = 'Seed phrase not found.';
             }
             return { error: errorMessage };
        }

        const data = await response.json();

        // Validate the revealed data against the specific reveal schema
        const validatedData = revealedSeedPhraseSchema.safeParse(data);

        if (!validatedData.success) {
             console.error("[Reveal Action] Reveal Data Validation Error:", validatedData.error.flatten(), { phraseId });
             return { error: 'Received invalid data format from server for the revealed phrase.' };
        }

        // Return the validated (but still encrypted) data
        return { data: validatedData.data };

    } catch (error) {
        console.error(`[Reveal Action] Network or unexpected error for Phrase ID: ${phraseId}`, error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { error: `Failed to connect to the server to reveal seed phrase: ${message}` };
    }
}


// Action to delete a seed phrase entry by its ID (public access) - REMOVED
// export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
    // ... removed implementation ...
// }
