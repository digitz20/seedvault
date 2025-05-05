
import Link from 'next/link';
import { ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react'; // Using ShieldCheck for the logo, removed LogIn, UserPlus
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/auth/utils'; // Import Session type
import { Button } from '@/components/ui/button';
import { handleSignOut } from '@/lib/auth/actions'; // Import server action for signout

interface HeaderProps {
  session: Session | null; // Accept session status
}

export default function Header({ session }: HeaderProps) {
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
          {session ? (
            // If logged in, show Dashboard and Logout
            <>
              <Button variant="ghost" size="sm" asChild className="text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground">
                 <Link href="/dashboard">
                   <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                 </Link>
               </Button>
               {/* Logout Button */}
               <form action={handleSignOut}>
                 <Button type="submit" variant="ghost" size="sm" className="text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground">
                   <LogOut className="mr-2 h-4 w-4" /> Logout
                 </Button>
               </form>
            </>
          ) : (
            // If not logged in, no explicit Login/Signup buttons shown here.
            // Users are directed via the 'Continue' button on homepage or middleware redirects.
            // Optionally, add a generic "Get Started" button if needed, which could link to '/save-seed' (and trigger login redirect if not logged in)
             <Button variant="ghost" size="sm" asChild className="text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground">
                 <Link href="/save-seed">
                   {/* Using a generic icon or just text */}
                    Get Started
                 </Link>
               </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
