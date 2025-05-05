
import { Suspense } from 'react';
// Update import to the combined form component
import { LoginAndSaveForm } from './_components/login-and-save-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Helper component to read search params (needed for Suspense boundary)
// Kept for potential future use, but the form now handles messages
function LoginMessages() {
  return null;
}

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
       <Button variant="ghost" size="sm" className="absolute left-4 top-4 md:left-8 md:top-8" asChild>
         <Link href="/">
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Home
         </Link>
       </Button>

      <Card className="w-full max-w-lg shadow-xl"> {/* Increased max-width for more fields */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Log In & Save Seed Phrase</CardTitle>
          <CardDescription>
             Log in to your SeedVault account and securely store your first seed phrase in one step.
             <Suspense fallback={null}>
                <LoginMessages />
             </Suspense>
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* Render the combined form */}
           <LoginAndSaveForm />
        </CardContent>
         <CardContent className="mt-4 text-center text-sm">
           <p>
             Don&apos;t have an account?{' '}
             <Button variant="link" asChild className="p-0 h-auto font-medium">
               <Link href="/signup">Sign up here</Link>
             </Button>
           </p>
         </CardContent>
      </Card>
    </div>
  );
}
