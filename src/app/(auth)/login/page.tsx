
import { LoginForm } from './_components/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getUserAuth } from '@/lib/auth/utils'; // Import utility to check auth
import { redirect } from 'next/navigation';

export default async function LoginPage() {
   // If user is already logged in, redirect to dashboard
   const { session } = await getUserAuth();
   if (session) {
     redirect('/dashboard');
   }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Login to SeedVault</CardTitle>
          <CardDescription>
            Enter your email and password to access your vault.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
           <p className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
