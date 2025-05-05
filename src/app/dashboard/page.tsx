// import { getUserSession } from '@/lib/auth'; // Placeholder for auth function
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, ShieldCheck } from 'lucide-react';
// import { SeedPhraseList } from './_components/seed-phrase-list'; // Component to display saved seeds (implement later)

export default async function DashboardPage() {
  // --- Authentication Check (Placeholder) ---
  // In a real app, protect this route and get user data
  // const session = await getUserSession();
  // if (!session?.user) {
  //   redirect('/login'); // Redirect to login if not authenticated
  // }
  // const user = session.user;
  // Replace with mock user for now
  const user = { email: 'user@example.com', id: 'mock-user-id' };
  // -----------------------------------------

  // --- Fetch Seed Phrases (Placeholder) ---
  // Fetch seed phrases associated with the user.id from the database
  // const seedPhrases = await getSeedPhrasesForUser(user.id);
  const seedPhrases: any[] = []; // Mock empty array for now
  // ------------------------------------

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
           <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your SeedVault Dashboard</h1>
           <p className="text-muted-foreground">Welcome back, {user.email}!</p>
        </div>
        {/* Add Logout Button Here (implement later) */}
         <Button variant="outline" size="sm">Log Out</Button>
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
             // Placeholder for the list component
            <div className="text-center text-muted-foreground">
                Seed phrase list will be displayed here.
                {/* <SeedPhraseList seedPhrases={seedPhrases} /> */}
            </div>
          )}
        </CardContent>
      </Card>

       {/* Add more dashboard sections/widgets as needed */}

    </div>
  );
}
