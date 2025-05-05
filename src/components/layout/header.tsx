
import Link from 'next/link';
import { ShieldCheck, PlusCircle } from 'lucide-react'; // Using ShieldCheck for the logo, PlusCircle for save seed link
import { cn } from '@/lib/utils';
// Removed Session type import
import { Button } from '@/components/ui/button';
// Removed handleSignOut import

// Removed HeaderProps interface and session prop

export default function Header() {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full",
      "border-b border-border/40 bg-accent text-accent-foreground", // Use accent, add subtle border
       "shadow-sm" // Add a small shadow
    )}>
      <div className="container flex h-16 items-center"> {/* Increased height slightly */}
        <Link href="/" className="flex items-center space-x-2 mr-6">
          {/* Icon color updated to accent-foreground */}
          <ShieldCheck className="h-7 w-7 text-accent-foreground" />
          {/* Text color updated to accent-foreground */}
          <span className="font-bold text-lg inline-block text-accent-foreground">
            SeedVault
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="ml-auto flex items-center space-x-4">
          {/* Always show "Save Seed" link as there's no login state */}
          <Button variant="ghost" size="sm" asChild className="text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground">
             <Link href="/save-seed">
                <PlusCircle className="mr-2 h-4 w-4" /> Save Seed Phrase
             </Link>
          </Button>
           {/* Optional: Link to the dashboard (though its functionality without auth is limited) */}
           <Button variant="ghost" size="sm" asChild className="text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground">
             <Link href="/dashboard">
               {/* <LayoutDashboard className="mr-2 h-4 w-4" /> */} Dashboard
             </Link>
           </Button>
        </nav>
      </div>
    </header>
  );
}
