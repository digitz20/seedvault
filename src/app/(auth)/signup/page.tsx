
import { SignupForm } from './_components/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getUserAuth } from '@/lib/auth/utils'; // Import utility to check auth
import { redirect } from 'next/navigation';

export default async function SignupPage() {
   // If user is already logged in, redirect to dashboard
   const { session } = await getUserAuth();
   if (session) {
     redirect('/dashboard');
   }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Create SeedVault Account</CardTitle>
          <CardDescription>
            Enter your email and choose a strong password to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
           <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
