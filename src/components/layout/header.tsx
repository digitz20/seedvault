import Link from 'next/link';
import { ShieldCheck } from 'lucide-react'; // Using ShieldCheck for the logo

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block">
            SeedVault
          </span>
        </Link>
        {/* TODO: Add navigation links here if needed */}
        {/* <nav className="ml-auto flex items-center space-x-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Dashboard</Link>
          <Link href="/save-seed" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Save Seed</Link>
        </nav> */}
      </div>
    </header>
  );
}
