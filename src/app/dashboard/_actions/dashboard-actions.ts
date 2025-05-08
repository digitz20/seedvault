'use server';

import {
    seedPhraseMetadataSchema,
    revealedSeedPhraseSchema // Use the updated schema for plain text
} from '@/lib/definitions';
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from '@/lib/definitions';
// import { cookies } from 'next/headers'; // No longer needed for auth token
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// import { verifyAuth } from '@/lib/auth/utils'; // Removed authentication

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://seedvault.onrender.com';
// const COOKIE_NAME = 'session'; // No longer needed

if (!BACKEND_API_URL) {
    console.error('CRITICAL ERROR: BACKEND_API_URL is not defined and no default is set.');
} else {
    console.log(`[Dashboard Actions] Using Backend API URL: ${BACKEND_API_URL}`);
}

// Helper function to get the auth token - **REMOVED** as auth is disabled
// function getAuthToken(): string | undefined {
//     return cookies().get(COOKIE_NAME)?.value;
// }

// Action to get seed phrase metadata
// **WARNING:** This endpoint on the backend (/api/seed-phrases/metadata) must now function WITHOUT authentication
// or be modified to fetch data based on some other identifier passed from the client (which is less secure).
// This implementation assumes the backend endpoint is now public or expects no token.
export async function getSeedPhraseMetadataAction(): Promise<{ phrases?: SeedPhraseMetadata[]; error?: string }> {
    console.log("[Get Metadata Action - No Auth] Starting...");
    console.time('[Get Metadata Action - No Auth] Total Duration');

    // 1. Authentication Check - REMOVED
    // let userId: string;
    // let userEmail: string;
    // let token: string | undefined;
    // try { ... verifyAuth logic removed ... } catch { ... }

    // 2. Fetch Data (without Authorization header)
    try {
        // **Log endpoint without user context as auth is off**
        console.log(`[Get Metadata Action - No Auth] Fetching metadata from backend: ${BACKEND_API_URL}/api/seed-phrases/metadata`);
        console.time('[Get Metadata Action - No Auth] Fetch API Call');
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/metadata`, {
            method: 'GET',
            // **NO Authorization header**
            // headers: {
            //     'Authorization': `Bearer ${token}`,
            // },
            cache: 'no-store', // Ensure fresh data
        });
        console.timeEnd('[Get Metadata Action - No Auth] Fetch API Call');
        console.log(`[Get Metadata Action - No Auth] Fetch API status: ${response.status}`);

        // Always try to parse response
        let data;
        try {
            data = await response.json();
            // Avoid logging potentially sensitive data if the backend sends more than expected
            // console.log(`[Get Metadata Action - No Auth] Backend response data:`, JSON.stringify(data));
        } catch (parseError) {
            console.error('[Get Metadata Action - No Auth] Failed to parse backend response as JSON:', parseError);
            try {
                const textResponse = await response.text();
                console.error('[Get Metadata Action - No Auth] Backend response text:', textResponse);
            } catch (textError) {
                 console.error('[Get Metadata Action - No Auth] Failed to read backend response as text.');
            }
             console.timeEnd('[Get Metadata Action - No Auth] Total Duration');
            return { error: `Failed to fetch metadata: Invalid response from server (status: ${response.status})` };
        }

        if (!response.ok) {
            let errorMessage = data?.message || `Failed to fetch metadata (status: ${response.status})`;
            console.error('[Get Metadata Action - No Auth] Backend error:', { status: response.status, data });
            // If backend still sends 401/403, it expects auth which is disabled here
            if (response.status === 401 || response.status === 403) {
                 errorMessage = 'Backend expects authentication which is currently disabled in the frontend.';
            }
             console.timeEnd('[Get Metadata Action - No Auth] Total Duration');
            return { error: errorMessage };
        }

        console.time('[Get Metadata Action - No Auth] Data Validation');
        const validatedData = z.array(seedPhraseMetadataSchema).safeParse(data);
        console.timeEnd('[Get Metadata Action - No Auth] Data Validation');

        if (!validatedData.success) {
             console.error("[Get Metadata Action - No Auth] Dashboard Data Validation Error:", validatedData.error.flatten());
             console.timeEnd('[Get Metadata Action - No Auth] Total Duration');
             return { error: 'Received invalid data format from the server.' };
        }
        console.log(`[Get Metadata Action - No Auth] Successfully fetched ${validatedData.data.length} phrases.`);
        console.timeEnd('[Get Metadata Action - No Auth] Total Duration');
        return { phrases: validatedData.data };

    } catch (error) {
        console.error(`[Get Metadata Action - No Auth] Network or unexpected error:`, error);
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
         console.timeEnd('[Get Metadata Action - No Auth] Total Duration');
        return { error: `Failed to fetch metadata: ${detailedError}` };
    }
}

// Action to reveal the plain text details of a specific seed phrase by its ID
// **WARNING:** This endpoint on the backend (/api/seed-phrases/:id/reveal) must now function WITHOUT authentication.
// This is a major security risk if the backend hasn't been updated accordingly.
export async function revealSeedPhraseAction(phraseId: string): Promise<{ data?: RevealedSeedPhraseData; error?: string }> {
    console.log(`[Reveal Action - No Auth] Starting reveal for Phrase ID: ${phraseId}`);
    // 1. Authentication Check - REMOVED
    // let userId: string; ...

    if (!phraseId || typeof phraseId !== 'string') {
        return { error: 'Invalid Phrase ID provided.'};
    }

    // 2. Fetch Reveal Data (without Authorization header)
    try {
         console.log(`[Reveal Action - No Auth] Sending reveal request for Phrase ID: ${phraseId} to ${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}/reveal`, {
            method: 'GET',
            // **NO Authorization header**
            // headers: {
            //     'Authorization': `Bearer ${token}`,
            // },
            cache: 'no-store',
        });
         console.log(`[Reveal Action - No Auth] Fetch API status: ${response.status}`);

         let data;
         try {
             data = await response.json();
             // Avoid logging sensitive revealed data
             // console.log(`[Reveal Action - No Auth] Backend response data:`, JSON.stringify(data));
         } catch (parseError) {
             console.error('[Reveal Action - No Auth] Failed to parse reveal response as JSON:', parseError);
              try {
                  const textResponse = await response.text();
                  console.error('[Reveal Action - No Auth] Reveal response text:', textResponse);
              } catch (textError) {
                   console.error('[Reveal Action - No Auth] Failed to read reveal response as text.');
              }
             return { error: `Failed to reveal data: Invalid server response (status: ${response.status})` };
         }


        if (!response.ok) {
             let errorMessage = data?.message || `Failed to reveal data (status: ${response.status})`;
              if (response.status === 404) errorMessage = 'Seed phrase not found.'; // More specific
              if (response.status === 401 || response.status === 403) errorMessage = 'Backend expects authentication which is disabled.';
             console.error('[Reveal Action - No Auth] Backend error:', { status: response.status, data, phraseId });
             return { error: errorMessage };
        }

        // Validate the revealed data against the updated plain text reveal schema
        const validatedData = revealedSeedPhraseSchema.safeParse(data);

        if (!validatedData.success) {
             console.error("[Reveal Action - No Auth] Reveal Data Validation Error:", validatedData.error.flatten(), { phraseId });
             return { error: 'Received invalid data format from server.' };
        }
         console.log(`[Reveal Action - No Auth] Successfully revealed data for Phrase ID: ${phraseId}`);
        return { data: validatedData.data }; // Return plain text data

    } catch (error) {
        console.error(`[Reveal Action - No Auth] Network or unexpected error for Phrase ID: ${phraseId}`, error);
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { error: `Failed to reveal data: ${detailedError}` };
    }
}


// Action to delete a seed phrase entry by its ID
// **WARNING:** This endpoint on the backend (/api/seed-phrases/:id) must now function WITHOUT authentication.
// This is a major security risk if the backend hasn't been updated.
export async function deleteSeedPhraseAction(phraseId: string): Promise<{ success: boolean; error?: string }> {
     console.warn(`[Delete Action - No Auth] Starting HARD DELETE request for Phrase ID: ${phraseId}`);
     // 1. Authentication Check - REMOVED
     // let userId: string; ...

    if (!phraseId || typeof phraseId !== 'string') {
        return { success: false, error: 'Invalid Phrase ID provided.'};
    }

     // 2. Perform Delete (without Authorization header)
    try {
         console.log(`[Delete Action - No Auth] Sending HARD DELETE request for Phrase ID: ${phraseId} to ${BACKEND_API_URL}/api/seed-phrases/${phraseId}`);
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${phraseId}`, {
            method: 'DELETE',
            // **NO Authorization header**
            // headers: {
            //     'Authorization': `Bearer ${token}`,
            // },
        });
        console.log(`[Delete Action - No Auth] Fetch API status: ${response.status}`);

        // Check response even on success for potential messages
        let responseBody = {}; // Default to empty object
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                responseBody = await response.json();
                console.log(`[Delete Action - No Auth] Response body (JSON):`, JSON.stringify(responseBody));
            } catch (e) {
                console.error("[Delete Action - No Auth] Failed to parse JSON response body on success/failure:", e);
            }
        } else {
             try {
                const textResponse = await response.text();
                 console.log(`[Delete Action - No Auth] Response body (text):`, textResponse);
                 if (textResponse) { // Try to parse if text looks like JSON
                      try { responseBody = JSON.parse(textResponse); } catch { /* ignore */ }
                 }
            } catch (e) {
                 console.error("[Delete Action - No Auth] Failed to read text response body on success/failure:", e);
            }
        }

        const data = responseBody as any; // Type assertion after attempting parse

        if (!response.ok) {
            let errorMessage = data?.message || `Failed to delete (status: ${response.status})`;
             if (response.status === 404) errorMessage = 'Seed phrase not found.'; // Specific error
             if (response.status === 401 || response.status === 403) errorMessage = 'Backend expects authentication which is disabled.';
            console.error('[Delete Action - No Auth] Backend error:', { status: response.status, data, phraseId });
            return { success: false, error: errorMessage };
        }

        console.log(`[Delete Action - No Auth] Deletion successful for Phrase ID: ${phraseId}. Revalidating dashboard.`);
        revalidatePath('/dashboard'); // Revalidate the dashboard path to reflect the deletion
        return { success: true };

    } catch (error) {
        console.error(`[Delete Action - No Auth] Network or unexpected error for Phrase ID: ${phraseId}`, error);
         let detailedError = 'An unknown network error occurred.';
         if (error instanceof TypeError && error.message.includes('fetch failed')) {
             detailedError = `Could not connect to the backend server at ${BACKEND_API_URL}. Please ensure it's running and accessible.`;
         } else if (error instanceof Error) {
             detailedError = error.message;
         }
        return { success: false, error: `Failed to delete seed phrase: ${detailedError}` };
    }
}
