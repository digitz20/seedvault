
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
    console.log('[Logout Action] Attempting to log out user.');
    try {
        // Delete the auth token cookie
        cookies().delete('auth_token');
        console.log('[Logout Action] Auth token cookie deleted.');
        // Also clear any client-side user state if necessary (e.g., localStorage)
        // Note: Server actions cannot directly modify localStorage.
        // This should be handled client-side upon redirect or response.
    } catch (error) {
        console.error('[Logout Action] Error deleting auth token cookie:', error);
        // Optionally handle the error, maybe redirect with an error message?
        // For now, we'll proceed to redirect anyway.
    }

    // Redirect the user to the login page (or home page)
    // Add a query param to potentially trigger client-side cleanup
    redirect('/login?logout=success');
}
