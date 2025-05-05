
'use client'; // Make this a Client Component to use hooks and handle client-side actions

import Link from 'next/link';
import { ShieldCheck, LogIn, UserPlus, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react'; // Add necessary icons
import { cn } from '@/lib/utils';
import type { Session } from '@/lib/definitions'; // Import Session type
import { Button } from '@/components/ui/button';
import { handleSignOut } from '@/lib/auth/actions'; // Import sign out action
import { usePathname, useRouter } from 'next/navigation'; // Import router for redirecting after signout

// Define props for the Header component
interface HeaderProps {
  session: Session | null; // Accept session object or null
}

export default function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = async () => {
      await handleSignOut();
      router.push('/'); // Redirect to homepage after sign out
      // Optionally refresh to ensure state is fully cleared if needed
      // router.refresh();
  };

  // Determine if a link is active
  const isActive = (href: string) => pathname === href;

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full",
      "border-b border-border/40 bg-accent text-accent-foreground", // Use accent, add subtle border
       "shadow-sm" // Add a small shadow
    )}>
      <div className="container flex h-16 items-center"> {/* Increased height slightly */}
        <Link href="/" className="flex items-center space-x-2 mr-auto"> {/* Use mr-auto to push nav to the right */}
          {/* Icon color updated to accent-foreground */}
          <ShieldCheck className="h-7 w-7 text-accent-foreground" />
          {/* Text color updated to accent-foreground */}
          <span className="font-bold text-lg inline-block text-accent-foreground">
            SeedVault
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
          {session ? (
            // User is logged in
            <>
              <Button
                variant={isActive('/dashboard') ? "secondary" : "ghost"} // Highlight active link
                size="sm"
                asChild
                className={cn(
                    "text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground",
                    isActive('/dashboard') && "bg-background/20" // Example active style
                 )}
               >
                 <Link href="/dashboard">
                    <LayoutDashboard className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span> {/* Show text on larger screens */}
                 </Link>
              </Button>
              <Button
                 variant={isActive('/save-seed') ? "secondary" : "ghost"}
                 size="sm"
                 asChild
                 className={cn(
                     "text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground",
                     isActive('/save-seed') && "bg-background/20"
                  )}
                >
                 <Link href="/save-seed">
                    <PlusCircle className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Save Seed</span>
                 </Link>
              </Button>
              <Button
                 variant="ghost"
                 size="sm"
                 onClick={onSignOut}
                 className="text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground"
                 aria-label="Sign Out"
              >
                <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            // User is logged out
            <>
              <Button
                 variant={isActive('/login') ? "secondary" : "ghost"}
                 size="sm"
                 asChild
                 className={cn(
                     "text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground",
                     isActive('/login') && "bg-background/20"
                 )}
               >
                 <Link href="/login">
                   <LogIn className="mr-1 sm:mr-2 h-4 w-4" /> Login
                 </Link>
              </Button>
               <Button
                  variant={isActive('/signup') ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className={cn(
                      "text-accent-foreground hover:bg-accent/80 hover:text-accent-foreground",
                      isActive('/signup') && "bg-background/20"
                  )}
                >
                  <Link href="/signup">
                    <UserPlus className="mr-1 sm:mr-2 h-4 w-4" /> Sign Up
                  </Link>
               </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
