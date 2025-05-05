
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, ShieldCheck, LogOut } from 'lucide-react';
// Removed: import { ObjectId } from 'mongodb';
// Removed: import { getSeedPhrasesCollection, getUsersCollection } from '@/lib/mongodb';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeedPhraseMetadata, UserClientData } from '@/lib/definitions'; // Use SeedPhraseMetadata
import { SeedPhraseList } from './_components/seed-phrase-list'; // Import the list component
import { logoutAction } from './_actions/logout-action'; // Import logout action

// Base URL for your backend API
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// --- Fetch User Data from Token (Example - Decode on Server) ---
// This is a conceptual example. In a real app, you might decode the JWT
// server-side if needed, or rely on client-side context after login.
// For simplicity here, we'll assume user info might be needed directly on the page.
// Alternatively, manage user state client-side after login.
async function getUserDataFromToken(): Promise<UserClientData | null> {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
        console.log('[Dashboard] No auth token found.');
        return null;
    }

    try {
        // WARNING: In a real app, DO NOT verify/decode JWTs directly on the frontend/Next.js server action.
        // The secret should only live on the backend.
        // This is a simplified example. Typically, you'd have an API endpoint like /api/auth/me
        // that verifies the token and returns user info.
        // For this example, we'll just simulate having user data available.
        // We cannot decode the token here without the secret.
        // Let's assume we have the user's email stored elsewhere or passed differently.
        // Or, make a call to a backend endpoint:
        // const response = await fetch(`${BACKEND_API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        // if (!response.ok) return null;
        // const userData = await response.json();
        // return { id: userData.id, email: userData.email, token };

        // --- Simplified Placeholder ---
        // Since we can't decode, let's return placeholder data indicating logged-in status.
        // The actual email won't be available here securely without a backend call or client-side state.
        console.log('[Dashboard] User token found (cannot decode here). Assuming logged in.');
        return { id: 'unknown', email: 'User' }; // Placeholder
        // --- End Simplified Placeholder ---

    } catch (error) {
        console.error('[Dashboard] Error handling token (simulation):', error);
        return null;
    }
}


// --- Fetch Seed Phrases from Backend API ---
async function getSeedPhrasesFromApi(): Promise<SeedPhraseMetadata[]> {
   const token = cookies().get('auth_token')?.value;
   if (!token) {
     console.warn('[Dashboard] No auth token found for fetching seed phrases.');
     return [];
   }

   console.log('[Dashboard] Fetching seed phrases from backend API.');
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/dashboard/seed-phrases`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, // Send the token
        'Content-Type': 'application/json',
      },
      // Add cache control if needed, e.g., 'no-store' for fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401 || response.status === 403) {
            console.warn(`[Dashboard] Authentication error (${response.status}) fetching seed phrases. Token might be invalid or expired.`);
            // Optionally trigger redirect or logout here
            // redirect('/login?error=session_expired'); // Example
        } else {
            console.error(`[Dashboard] API error fetching seed phrases: ${response.status} ${response.statusText}`);
        }
        return []; // Return empty on error
    }

    const phrases: SeedPhraseMetadata[] = await response.json();
    console.log(`[Dashboard] Received ${phrases.length} seed phrases from API.`);
    // Data should already be in the correct format (SeedPhraseMetadata)
    return phrases;

  } catch (error) {
    console.error('[Dashboard] Network error fetching seed phrases:', error);
    return []; // Return empty array on network error
  }
}

export default async function DashboardPage() {
  // 1. Authentication Check (using cookie presence) & Get User Placeholder
   // This check is now primarily handled by the middleware.
   // We fetch user data mainly for display purposes if needed.
  const userData = await getUserDataFromToken();
  if (!userData) {
     // This redirect might be redundant if middleware catches it first, but good as a fallback.
    redirect('/login?error=not_authenticated');
  }
  const user = userData; // For display

  // 2. Fetch Seed Phrases via API
  const seedPhrases = await getSeedPhrasesFromApi();

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
           <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your SeedVault Dashboard</h1>
           {/* Display placeholder or fetch actual email via separate mechanism */}
           <p className="text-muted-foreground">Welcome back, {user.email || 'User'}!</p>
        </div>
         {/* Logout Button */}
         <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
         </form>
      </header>

      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Your Saved Seed Phrases</CardTitle>
          <Button size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/save-seed">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Seed
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {seedPhrases.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/50 p-8 text-center">
               <ShieldCheck className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No seed phrases saved yet.</p>
              <p className="text-sm text-muted-foreground">
                Click "Add New Seed" to securely store your first phrase.
              </p>
              <Button size="lg" asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
                 <Link href="/save-seed">Add Your First Seed</Link>
              </Button>
            </div>
          ) : (
            // Render the list component - needs update to use SeedPhraseMetadata
            <SeedPhraseList seedPhrases={seedPhrases} />
          )}
        </CardContent>
      </Card>

       {/* Add more dashboard sections/widgets as needed */}

    </div>
  );
}
