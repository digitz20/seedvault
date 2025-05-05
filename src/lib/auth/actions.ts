
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
    signupSchema,
    loginSchema,
    authResponseSchema,
    type SignupFormData,
    type LoginFormData
} from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const AUTH_COOKIE_NAME = 'authToken';

// --- Sign Up Action ---
export async function handleSignUp(
    formData: SignupFormData
): Promise<{ success: boolean; error?: string }> {

    // 1. Validate Input
    const validatedFields = signupSchema.safeParse(formData);
    if (!validatedFields.success) {
        console.error('[Sign Up Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
        const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
        return {
          success: false,
          error: firstError || 'Invalid data. Please check your input.',
        };
    }

    // 2. Call Backend API
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedFields.data),
        });

        const result = await response.json();

        if (!response.ok) {
             console.error(`[Sign Up Action] Backend error (${response.status}):`, result.message);
            return { success: false, error: result.message || `Signup failed (status: ${response.status})` };
        }

        // 3. Validate Backend Response
         const validatedResponse = authResponseSchema.safeParse(result);
         if (!validatedResponse.success) {
             console.error('[Sign Up Action] Invalid response from backend:', validatedResponse.error);
             return { success: false, error: 'Invalid response received from server.' };
         }

        // 4. Set Auth Cookie
        cookies().set(AUTH_COOKIE_NAME, validatedResponse.data.token, {
            httpOnly: true, // Protects against XSS
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            maxAge: 60 * 60 * 24 * 1, // 1 day expiry to match JWT
            path: '/', // Make cookie available across the site
            sameSite: 'lax', // Good default for CSRF protection
        });

        console.log('[Sign Up Action] Signup successful and cookie set for:', validatedResponse.data.user.email);
        return { success: true };

    } catch (error) {
        console.error('[Sign Up Action] Network or unexpected error:', error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { success: false, error: `Signup failed: ${message}` };
    }
}

// --- Sign In Action ---
export async function handleSignIn(
    formData: LoginFormData
): Promise<{ success: boolean; error?: string }> {

    // 1. Validate Input
    const validatedFields = loginSchema.safeParse(formData);
    if (!validatedFields.success) {
         console.error('[Sign In Action] Frontend validation failed:', validatedFields.error.flatten().fieldErrors);
         const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
        return {
          success: false,
          error: firstError || 'Invalid data. Please check your input.',
        };
    }

    // 2. Call Backend API
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedFields.data),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error(`[Sign In Action] Backend error (${response.status}):`, result.message);
            return { success: false, error: result.message || `Login failed (status: ${response.status})` };
        }

         // 3. Validate Backend Response
         const validatedResponse = authResponseSchema.safeParse(result);
         if (!validatedResponse.success) {
             console.error('[Sign In Action] Invalid response from backend:', validatedResponse.error);
             return { success: false, error: 'Invalid response received from server.' };
         }

        // 4. Set Auth Cookie
        cookies().set(AUTH_COOKIE_NAME, validatedResponse.data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 1, // 1 day
            path: '/',
            sameSite: 'lax',
        });

         console.log('[Sign In Action] Login successful and cookie set for:', validatedResponse.data.user.email);
        return { success: true };

    } catch (error) {
        console.error('[Sign In Action] Network or unexpected error:', error);
        const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
        return { success: false, error: `Login failed: ${message}` };
    }
}

// --- Sign Out Action ---
export async function handleSignOut() {
    // 1. Delete Auth Cookie
    cookies().delete(AUTH_COOKIE_NAME);
    console.log('[Sign Out Action] Auth cookie deleted.');

     // 2. Revalidate paths that depend on auth state
     revalidatePath('/', 'layout'); // Revalidate root layout to update header
     revalidatePath('/dashboard');
     revalidatePath('/login');
     revalidatePath('/signup');


    // 3. Redirect to Login Page
    redirect('/login?message=You have been logged out.');
}
