import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col items-center text-center">
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
          <CardTitle className="text-center">Get Started</CardTitle>
          <CardDescription className="text-center">
            Securely save your first seed phrase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {/* Placeholder image or illustration can go here */}
           <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed bg-muted/50">
             <p className="text-sm text-muted-foreground">Secure Storage</p>
           </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/save-seed">Continue</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
