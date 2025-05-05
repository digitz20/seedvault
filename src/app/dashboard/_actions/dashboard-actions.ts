
'use server';

import {
    seedPhraseMetadataSchema,
    revealedSeedPhraseSchema
} from '@/lib/definitions';
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from '@/lib/definitions';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// Action to get seed phrase metadata for the dashboard list
export async function getSeedPhraseMetadataAction(): Promise<{ phrases?: SeedPhraseMetadata[]; error?: string }> {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        return { error: 'Authentication required.' };
    }

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/dashboard/seed-phrases`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store', // Ensure fresh data is fetched every time
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 return { error: 'Authentication failed. Please log in again.' };
            }
            const errorData = await response.json().catch(() => ({ message: `Failed to fetch data (status: ${response.status})` }));
            return { error: errorData.message || `Failed to fetch data (status: ${response.status})` };
        }

        const data = await response.json();

        // Validate the fetched data against the schema
        const validatedData = z.array(seedPhraseMetadataSchema).safeParse(data);

        if (!validatedData.success) {
             console.error("Dashboard Data Validation Error:", validatedData.error);
             return { error: 'Received invalid data format from server.' };
        }

        return { phrases: validatedData.data };

    } catch (error) {
        console.error('[Get Metadata Action] Network or unexpected error:', error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { error: `Failed to fetch seed phrases: ${message}` };
    }
}

// Action to reveal the (still encrypted) details of a specific seed phrase
export async function revealSeedPhraseAction(phraseId: string): Promise<{ data?: RevealedSeedPhraseData; error?: string }> {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        return { error: 'Authentication required.' };
    }
    if (!phraseId) {
        return { error: 'Phrase ID is required.'}
    }

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
             if (response.status === 401 || response.status === 403) {
                 return { error: 'Authentication failed or access denied.' };
             }
             if (response.status === 404) {
                 return { error: 'Seed phrase not found.' };
             }
            const errorData = await response.json().catch(() => ({ message: `Failed to reveal data (status: ${response.status})` }));
            return { error: errorData.message || `Failed to reveal data (status: ${response.status})` };
        }

        const data = await response.json();

        // Validate the revealed data against the schema
        const validatedData = revealedSeedPhraseSchema.safeParse(data);

        if (!validatedData.success) {
             console.error("Reveal Data Validation Error:", validatedData.error);
             return { error: 'Received invalid data format from server for revealed phrase.' };
        }

        // Return the *encrypted* data
        return { data: validatedData.data };

    } catch (error) {
        console.error(`[Reveal Action Error] Phrase ID: ${phraseId}`, error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { error: `Failed to reveal seed phrase: ${message}` };
    }
}


// Action to delete a seed phrase entry
export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
        return { success: false, error: 'Authentication required.' };
    }
     if (!phraseId) {
        return { success: false, error: 'Phrase ID is required.'}
    }

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return { success: false, error: 'Authentication failed or access denied.' };
            }
            if (response.status === 404) {
                return { success: false, error: 'Seed phrase not found.' };
            }
            const errorData = await response.json().catch(() => ({ message: `Failed to delete (status: ${response.status})` }));
            return { success: false, error: errorData.message || `Failed to delete (status: ${response.status})` };
        }

        // Check for 200 OK or 204 No Content
        if (response.status === 200 || response.status === 204) {
             return { success: true };
        } else {
            // Should have been caught by !response.ok, but as a fallback
            return { success: false, error: `Unexpected status code: ${response.status}` };
        }


    } catch (error) {
        console.error(`[Delete Action Error] Phrase ID: ${phraseId}`, error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { success: false, error: `Failed to delete seed phrase: ${message}` };
    }
}
