'use client'; // Make this a Client Component to use hooks and handle client-side actions

import Link from 'next/link';
import { KeyRound, LogIn, UserPlus } from 'lucide-react'; // Keep basic icons
import { cn } from '@/lib/utils';
// import type { Session } from '@/lib/definitions'; // Session type no longer needed
import { Button } from '@/components/ui/button';
// import { handleSignOut } from '@/lib/actions/auth-actions'; // Sign out action removed
import { usePathname, useRouter } from 'next/navigation';

// Define props for the Header component - Session is now always null
interface HeaderProps {
  session: null; // Explicitly set to null
}

export default function Header({ session }: HeaderProps) { // session prop is now always null
  const pathname = usePathname();
  const router = useRouter();

  // Sign out function removed
  // const onSignOut = async () => { ... };

  // Determine if a link is active
  const isActive = (href: string) => pathname === href;

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full",
      "border-b border-border/40 bg-accent text-accent-foreground", // Use accent, add subtle border
       "shadow-sm" // Add a small shadow
    )}>
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2 mr-auto">
          <KeyRound className="h-7 w-7 text-accent-foreground" />
          <span className="font-bold text-lg inline-block text-accent-foreground">
            SeedVault
          </span>
        </Link>

        {/* Navigation Links - Always show Login/Signup */}
        <nav className="flex items-center space-x-2 sm:space-x-4">
           {/* Removed conditional rendering based on session */}
           <>
              <Button
                 variant={isActive('/login') ? "secondary" : "ghost"}
                 size="sm"
                 asChild
                 className={cn(
                     "text-accent-foreground",
                     "hover:bg-white/10 hover:text-accent-foreground",
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
                      "text-accent-foreground",
                      "hover:bg-white/10 hover:text-accent-foreground",
                      isActive('/signup') && "bg-background/20"
                  )}
                >
                  <Link href="/signup">
                    <UserPlus className="mr-1 sm:mr-2 h-4 w-4" /> Sign Up
                  </Link>
               </Button>
            </>
        </nav>
      </div>
    </header>
  );
}
