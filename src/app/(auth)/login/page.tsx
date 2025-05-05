
import { LoginForm } from './_components/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react'; // Use the main logo icon

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
       {/* Optional: Add a link back to the homepage */}
        <Link href="/" className="mb-8 flex items-center space-x-2 text-muted-foreground hover:text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-semibold">SeedVault Home</span>
        </Link>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">Sign In to SeedVault</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
