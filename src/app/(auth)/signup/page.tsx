
import { SignupForm } from './_components/signup-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react'; // Use the main logo icon

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Optional: Add a link back to the homepage */}
        <Link href="/" className="mb-8 flex items-center space-x-2 text-muted-foreground hover:text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold">SeedVault Home</span>
        </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Create your SeedVault Account</CardTitle>
          <CardDescription>
            Sign up to securely store your seed phrases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
