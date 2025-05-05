
import { SeedPhraseForm } from './_components/seed-phrase-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getUserAuth } from '@/lib/auth/utils'; // Import utility to check auth
import { redirect } from 'next/navigation';

export default async function SaveSeedPage() {
   // Protect this page - redirect if not logged in (Middleware should catch this, but good as fallback)
   const { session } = await getUserAuth();
   if (!session) {
     // Redirect to login, adding a message and potentially a redirect URL for after login
     redirect('/login?message=Please log in or sign up to save a seed phrase.&redirect=/save-seed');
   }


  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
       <Button variant="ghost" size="sm" className="absolute left-4 top-4 md:left-8 md:top-8" asChild>
          {/* Link back to dashboard since user must be logged in to reach here */}
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
          <SeedPhraseForm />
        </CardContent>
      </Card>
    </div>
  );
}
