'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
    console.log('[Logout Action] Attempting to log out user.');
    try {
        // Delete the session cookie
        cookies().delete('session_id');
        console.log('[Logout Action] Session cookie deleted.');
    } catch (error) {
        console.error('[Logout Action] Error deleting session cookie:', error);
        // Optionally handle the error, maybe redirect with an error message?
        // For now, we'll proceed to redirect anyway.
    }

    // Redirect the user to the login page (or home page)
    redirect('/login?logout=success');
}
