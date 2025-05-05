import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { cookies } from 'next/headers'; // Import cookies to check session

// --- Mock Authentication Check (Server-side) ---
// In a real app, replace this with a proper session check
async function checkServerSession(): Promise<boolean> {
  const sessionId = cookies().get('session_id')?.value;
  // Basic mock check
  return !!sessionId && sessionId.startsWith('mock-session-');
}
// -----------------------------------------

export default async function Home() {
  const isLoggedIn = await checkServerSession(); // Check session state

  return (
    <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col items-center text-center">
         {/* Use primary color for the main icon */}
         <ShieldCheck className="mb-4 h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to SeedVault
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Your secure digital safe for storing cryptocurrency seed phrases. Never lose access to your assets again.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">
            {isLoggedIn ? 'Access Your Vault' : 'Get Started'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLoggedIn
              ? 'Manage your saved seed phrases securely.'
              : 'Create an account or log in to begin.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
           {/* Keep placeholder subtle */}
           <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed bg-muted/50 p-4 text-center">
             <p className="text-sm font-medium text-muted-foreground">End-to-End Encryption <br /> Your Data is Safe</p>
           </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          {isLoggedIn ? (
             // Use primary color for the main logged-in action
             <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
               <Link href="/dashboard">
                 <LayoutDashboard className="mr-2" /> Go to Dashboard
               </Link>
             </Button>
            // Optionally add Logout button here if desired on homepage when logged in
            // <Button size="lg" variant="outline" className="w-full sm:w-auto">Log Out</Button>
          ) : (
            <>
              {/* Use accent color for the primary sign-up action */}
              <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
                <Link href="/signup">
                  <UserPlus className="mr-2" /> Sign Up
                </Link>
              </Button>
              {/* Use outline variant for the secondary log-in action */}
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/login">
                  <LogIn className="mr-2" /> Log In
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
