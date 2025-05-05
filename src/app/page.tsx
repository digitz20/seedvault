
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, LogIn, UserPlus } from 'lucide-react'; // Added LogIn, UserPlus icons

// Removed getUserAuth as authentication status isn't needed for button display anymore

export default function Home() {
  // No need to check session here anymore

  return (
    <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col items-center text-center">
         {/* Use primary color for the main icon */}
         <ShieldCheck className="mb-4 h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to SeedVault
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Your secure digital safe for storing cryptocurrency seed phrases. Log in or sign up to get started.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">
            Get Started
          </CardTitle>
          <CardDescription className="text-center">
             Log in to access your vault or sign up to create a new secure account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
           {/* Keep placeholder subtle */}
           <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed bg-muted/50 p-4 text-center">
             <p className="text-sm font-medium text-muted-foreground">End-to-End Encryption <br /> Your Data is Safe</p>
           </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 sm:flex-row">
           {/* Login Button */}
           <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
             <Link href="/login">
               <LogIn className="mr-2 h-5 w-5" /> Login
             </Link>
           </Button>
           {/* Signup Button */}
           <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
             <Link href="/signup">
               <UserPlus className="mr-2 h-5 w-5" /> Sign Up
             </Link>
           </Button>
        </CardFooter>
      </Card>

       {/* Warning Text - Moved outside and below the Card */}
       <p className="mt-6 text-center text-sm font-semibold text-destructive">
         Warning: Do not share your seed phrase or account password with anyone. SeedVault cannot recover lost passwords or phrases.
       </p>
    </div>
  );
}
