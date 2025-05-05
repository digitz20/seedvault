import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, ShieldCheck, LogOut } from 'lucide-react';
import { ObjectId } from 'mongodb';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSeedPhrasesCollection, getUsersCollection } from '@/lib/mongodb';
import type { SeedPhraseData, User } from '@/lib/definitions';
import { SeedPhraseList } from './_components/seed-phrase-list'; // Import the list component
import { logoutAction } from './_actions/logout-action'; // Import logout action

// --- Authentication & User Data Retrieval ---
async function getUserDataFromSession(): Promise<{ user: Omit<User, 'passwordHash'> & {id: string} } | null> {
  const sessionId = cookies().get('session_id')?.value;
  if (!sessionId || !sessionId.startsWith('session-')) {
    console.log('[Dashboard] No valid session found.');
    return null;
  }

  // Extract userId from session ID (adjust based on your session ID format)
  const userIdString = sessionId.split('-')[1];
  if (!userIdString) {
      console.error('[Dashboard] Could not extract userId from session:', sessionId);
      return null;
  }

  console.log('[Dashboard] Extracted userIdString:', userIdString);

  let userId: ObjectId;
  try {
      userId = new ObjectId(userIdString);
       console.log('[Dashboard] Converted to ObjectId:', userId);
  } catch (e) {
      console.error('[Dashboard] Invalid userId format in session, cannot convert to ObjectId:', userIdString, e);
      // Clear invalid cookie?
      // cookies().delete('session_id');
      return null;
  }


  try {
    const usersCollection = await getUsersCollection();
    const userDoc = await usersCollection.findOne({ _id: userId });

    if (!userDoc) {
      console.warn('[Dashboard] User not found in DB for userId:', userId);
      // Clear invalid cookie?
      // cookies().delete('session_id');
      return null;
    }

    // Return user data without the password hash
    const { passwordHash, ...userData } = userDoc;
     console.log('[Dashboard] Found user:', userData.email);
    return { user: { ...userData, id: userDoc._id.toString() } };

  } catch (error) {
    console.error('[Dashboard] Error fetching user data:', error);
    return null;
  }
}

// --- Fetch Seed Phrases ---
async function getSeedPhrasesForUser(userId: ObjectId): Promise<SeedPhraseData[]> {
   console.log('[Dashboard] Fetching seed phrases for userId (ObjectId):', userId);
  try {
    const seedPhrasesCollection = await getSeedPhrasesCollection();
    const phrases = await seedPhrasesCollection.find({ userId: userId }).toArray();
    console.log(`[Dashboard] Found ${phrases.length} seed phrases for user.`);
    // Ensure _id is stringified if needed by the client component, though SeedPhraseList might handle ObjectId
     return phrases.map(phrase => ({
      ...phrase,
      _id: phrase._id?.toString(), // Convert ObjectId to string for client component props if necessary
      userId: phrase.userId.toString(), // Convert userId ObjectId to string
    })) as unknown as SeedPhraseData[]; // Cast needed due to ObjectId conversion complexity

  } catch (error) {
    console.error('[Dashboard] Error fetching seed phrases:', error);
    return []; // Return empty array on error
  }
}

export default async function DashboardPage() {
  // 1. Authentication Check & Get User Data
  const sessionData = await getUserDataFromSession();
  if (!sessionData?.user) {
    redirect('/login'); // Redirect to login if not authenticated
  }
  const user = sessionData.user;

  // 2. Fetch Seed Phrases for the User
  const seedPhrases = await getSeedPhrasesForUser(new ObjectId(user.id)); // Pass ObjectId

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
           <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your SeedVault Dashboard</h1>
           <p className="text-muted-foreground">Welcome back, {user.email}!</p>
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
            // Render the list component
            <SeedPhraseList seedPhrases={seedPhrases} />
          )}
        </CardContent>
      </Card>

       {/* Add more dashboard sections/widgets as needed */}

    </div>
  );
}
