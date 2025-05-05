
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { getUserAuth } from '@/lib/auth/utils'; // Import utility to check auth

export default async function Home() {
  const { session } = await getUserAuth(); // Check if user is logged in

  return (
    <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col items-center text-center">
         {/* Use primary color for the main icon */}
         <ShieldCheck className="mb-4 h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to SeedVault
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Your secure digital safe for storing cryptocurrency seed phrases. Never lose access to your assets again. Log in or sign up to get started.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">
            {session ? 'Access Your Vault' : 'Get Started'}
          </CardTitle>
          <CardDescription className="text-center">
            {session
              ? 'View your saved phrases or add a new one.'
              : 'Log in to access your vault or sign up for a new account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
           {/* Keep placeholder subtle */}
           <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed bg-muted/50 p-4 text-center">
             <p className="text-sm font-medium text-muted-foreground">End-to-End Encryption <br /> Your Data is Safe</p>
           </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          {session ? (
            // Show Dashboard button if logged in
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
               <Link href="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
               </Link>
             </Button>
          ) : (
            // Show Login and Signup buttons if not logged in
            <>
              <Button size="lg" asChild variant="default" className="w-full sm:w-auto">
                <Link href="/login">
                   <LogIn className="mr-2 h-5 w-5" /> Login
                </Link>
              </Button>
              <Button size="lg" asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/signup">
                   <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

       {/* Warning Text - Moved outside and below the Card */}
       <p className="mt-4 text-center text-xs font-semibold text-destructive">
         Warning: Do not share your seed phrase or account password with anyone. SeedVault cannot recover lost passwords or phrases.
       </p>
    </div>
  );
}
