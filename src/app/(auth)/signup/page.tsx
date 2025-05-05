
import { SignupForm } from './_components/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      <Button variant="ghost" size="sm" className="absolute left-4 top-4 md:left-8 md:top-8" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Home
        </Link>
      </Button>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Create Account</CardTitle>
          <CardDescription>
             Sign up to start securing your seed phrases with SeedVault.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
         <CardContent className="mt-4 text-center text-sm">
           <p>
             Already have an account?{' '}
             <Button variant="link" asChild className="p-0 h-auto font-medium">
               <Link href="/login">Log in here</Link>
             </Button>
           </p>
         </CardContent>
      </Card>
    </div>
  );
}
