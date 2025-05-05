
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, AlertTriangle, Eye, Trash2, LogOut } from "lucide-react"; // Added LogOut icon
import Link from "next/link";
import { getSeedPhraseMetadataAction } from "./_actions/dashboard-actions";
import SeedPhraseTable from "./_components/seed-phrase-table";
import DeleteAccountButton from './_components/delete-account-button';
import type { SeedPhraseMetadata } from '@/lib/definitions';
import { verifyAuth } from '@/lib/auth/utils'; // Import verifyAuth
import { redirect } from 'next/navigation'; // Import redirect
import { getUserAuth } from '@/lib/auth/utils'; // Import getUserAuth to get user email

// Component to fetch and display data, handling loading and errors
async function SeedPhraseList() {
  // Authentication is already verified in the main page component
  const { phrases, error } = await getSeedPhraseMetadataAction(); // Action now handles auth implicitly

  if (error) {
    // Check for specific auth error message to redirect
    if (error.includes('Authentication required') || error.includes('Authentication failed')) {
         console.warn("[Dashboard - SeedPhraseList] Auth error during data fetch. Redirecting.");
         redirect('/login?message=Session expired or invalid. Please log in again.');
    }

    return (
      <div className="text-center py-12 text-destructive flex flex-col items-center gap-2">
         <AlertTriangle className="w-10 h-10" />
         <p className="font-semibold">Error loading seed phrases</p>
         <p className="text-sm max-w-md">{error}</p>
         <p className="text-xs text-muted-foreground mt-2">Please ensure the backend server is running and you are logged in.</p>
      </div>
    );
  }

  // The filtering of 'removed' phrases happens client-side in SeedPhraseTable
  const allPhrases = phrases || [];

  if (allPhrases.length === 0) {
    return (
       <div className="text-center py-12">
         <p className="text-muted-foreground">No seed phrases have been saved yet.</p>
         <Button asChild variant="link" className="mt-2">
           <Link href="/save-seed">Add the first one!</Link>
         </Button>
       </div>
    );
  }

  // Pass all phrases to the table; it will handle filtering based on localStorage
  return <SeedPhraseTable phrases={allPhrases} />;
}

// Skeleton loader for the table
function TableSkeleton() {
    return (
        <div className="space-y-4 p-4">
             <div className="h-8 bg-muted rounded w-1/4 animate-pulse mb-4"></div> {/* Header Skel */}
             <div className="border rounded-md">
                 <div className="flex justify-between p-4 border-b bg-muted/50">
                     <div className="h-5 bg-muted rounded w-1/5 animate-pulse"></div>
                     <div className="h-5 bg-muted rounded w-1/5 animate-pulse"></div>
                     <div className="h-5 bg-muted rounded w-1/4 animate-pulse"></div>
                     <div className="h-5 bg-muted rounded w-1/6 animate-pulse"></div>
                 </div>
                 <div className="space-y-2 p-4">
                     {[...Array(3)].map((_, i) => (
                         <div key={i} className="flex justify-between items-center h-10">
                             <div className="h-5 bg-muted rounded w-1/5 animate-pulse"></div>
                             <div className="h-5 bg-muted rounded w-1/5 animate-pulse"></div>
                             <div className="h-5 bg-muted rounded w-1/4 animate-pulse"></div>
                             <div className="flex gap-2 w-1/6 justify-end">
                                <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                                <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    )
}

export default async function DashboardPage() {
   let userEmail: string | null = null;

   // Verify authentication - redirect if not logged in
   try {
       const { session } = await getUserAuth(); // Get session which includes user email
       if (!session?.user) {
            throw new Error("User not authenticated");
       }
       userEmail = session.user.email;
       console.log(`[Dashboard Page] User authenticated: ${userEmail}`);
   } catch (error) {
        console.warn("[Dashboard Page] User not authenticated. Redirecting to login.");
       redirect('/login?message=Please log in to view your dashboard.');
   }


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SeedVault Dashboard</h1>
           {userEmail && (
              <p className="text-muted-foreground mt-1">
                Welcome, <span className="font-medium">{userEmail}</span>. View your securely stored entries.
              </p>
           )}
        </div>
        <Button asChild>
          <Link href="/save-seed">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Seed Phrase
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Saved Seed Phrases</CardTitle>
          <CardDescription>
              Click the eye icon <Eye className="inline h-4 w-4 text-muted-foreground align-text-bottom" /> to reveal details,
              or the trash icon <Trash2 className="inline h-4 w-4 text-muted-foreground align-text-bottom" /> to delete an entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<TableSkeleton />}>
               <SeedPhraseList />
           </Suspense>
        </CardContent>
      </Card>

        <div className="mt-8 flex flex-col items-center gap-4">
           {/* Pass user email or ID if needed by the button, or let it handle auth internally */}
           <DeleteAccountButton />
           {/* Security Warning moved here */}
           <p className="text-destructive font-semibold text-center text-sm mt-4 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> SECURITY WARNING: Keep your seed phrases and associated information private. Avoid screenshots or sharing. SeedVault cannot recover lost data.
            </p>
       </div>
    </div>
  );
}

