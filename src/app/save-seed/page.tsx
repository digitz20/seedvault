
import { SeedPhraseForm } from './_components/seed-phrase-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SaveSeedPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
       <Button variant="ghost" size="sm" className="absolute left-4 top-4 md:left-8 md:top-8" asChild>
         <Link href="/"> {/* Link back to home page */}
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Home
         </Link>
       </Button>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Store Seed Phrase</CardTitle>
          <CardDescription>
            Enter your wallet details below to securely store your information.
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
