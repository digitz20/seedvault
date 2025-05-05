import Link from 'next/link';
import { ShieldCheck } from 'lucide-react'; // Using ShieldCheck for the logo
import { cn } from '@/lib/utils';

export default function Header() {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full",
      "bg-accent text-accent-foreground" // Use accent color for background and foreground text
      // Removed border-b for a cleaner look with solid color
    )}>
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          {/* Icon color updated to accent-foreground */}
          <ShieldCheck className="h-6 w-6 text-accent-foreground" />
          {/* Text color updated to accent-foreground */}
          <span className="font-bold inline-block text-accent-foreground">
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
