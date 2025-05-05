
import { SeedPhraseForm } from './_components/seed-phrase-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { verifyAuth } from '@/lib/auth/utils'; // Import verifyAuth
import { redirect } from 'next/navigation'; // Import redirect

export default async function SaveSeedPage() {
   // Verify authentication - redirect if not logged in
   try {
       await verifyAuth();
       console.log("[Save Seed Page] User authenticated.");
   } catch (error) {
        console.warn("[Save Seed Page] User not authenticated. Redirecting to login.");
       redirect('/login?message=Please log in to save a seed phrase.');
   }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative"> {/* Added relative positioning */}
       {/* Position the back button */}
       <Button variant="ghost" size="sm" className="absolute left-4 top-4 md:left-8 md:top-8" asChild>
         <Link href="/dashboard">
           <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
         </Link>
       </Button>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Add New Seed Phrase</CardTitle>
          <CardDescription>
            Enter the details for the wallet or service whose seed phrase you want to securely store.
             <br />
             <span className="mt-1 block text-xs font-semibold text-destructive">
               Warning: Never share your seed phrase with anyone. SeedVault encrypts your data, but security starts with you.
             </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* Pass userId to the form if needed, or rely on action to get it */}
           <SeedPhraseForm />
        </CardContent>
      </Card>
    </div>
  );
}
