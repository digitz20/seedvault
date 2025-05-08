import React, { Suspense, lazy } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, AlertTriangle, Eye, Trash2, LogOut, UserCircle } from "lucide-react"; // Added UserCircle
import Link from "next/link";
import { getSeedPhraseMetadataAction } from "./_actions/dashboard-actions";
import type { SeedPhraseMetadata } from '@/lib/definitions';
// import { getUserAuth } from '@/lib/auth/utils'; // Removed auth import
import { redirect } from 'next/navigation';

// Lazy load components that might not be needed immediately
const SeedPhraseTable = lazy(() =>
  import("./_components/seed-phrase-table")
    // Handle potential loading errors for the lazy component
    .catch(err => {
        console.error("Failed to load SeedPhraseTable component:", err);
        // Return a fallback component or null
        return { default: () => <div className="text-destructive text-center p-4">Error loading table component.</div> };
    })
);
const DeleteAccountButton = lazy(() =>
  import('./_components/delete-account-button')
    .catch(err => {
        console.error("Failed to load DeleteAccountButton component:", err);
         // Return a fallback component or null
        return { default: () => <Button variant="destructive" disabled>Error loading button</Button> };
    })
);

// Component to fetch and display data, handling loading and errors
async function SeedPhraseList() {
  console.log("[Dashboard - SeedPhraseList] Fetching seed phrase metadata...");
  // Fetch data (no authentication assumed here, backend needs adjustment)
  let phrases: SeedPhraseMetadata[] = [];
  let error: string | undefined;

  try {
      console.time("[Dashboard - SeedPhraseList] getSeedPhraseMetadataAction Duration");
      const result = await getSeedPhraseMetadataAction();
      console.timeEnd("[Dashboard - SeedPhraseList] getSeedPhraseMetadataAction Duration");

      if (result.error) {
          console.error("[Dashboard - SeedPhraseList] Error fetching metadata:", result.error);
          error = result.error;
      } else {
          phrases = result.phrases || [];
          console.log(`[Dashboard - SeedPhraseList] Fetched ${phrases.length} phrases successfully.`);
      }
  } catch (fetchError: any) {
      console.error("[Dashboard - SeedPhraseList] Unexpected error during fetch action:", fetchError);
      error = `An unexpected error occurred while fetching data: ${fetchError.message || 'Unknown error'}`;
  }


  if (error) {
    // Display error message if fetching failed
    return (
      <div className="text-center py-12 text-destructive flex flex-col items-center gap-2">
         <AlertTriangle className="w-10 h-10" />
         <p className="font-semibold">Error loading seed phrases</p>
         <p className="text-sm max-w-md">{error}</p>
         <p className="text-xs text-muted-foreground mt-2">Please ensure the backend server is running and accessible.</p>
         {/* Add a refresh button */}
         <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-4">
            Try Again
         </Button>
      </div>
    );
  }

  if (phrases.length === 0) {
    return (
       <div className="text-center py-12">
         <p className="text-muted-foreground">No seed phrases have been saved yet.</p>
         <Button asChild variant="link" className="mt-2">
           {/* Link to save-seed page - This page needs to work without auth now */}
           <Link href="/save-seed">Add the first one!</Link>
         </Button>
       </div>
    );
  }

  // Pass fetched phrases to the table
  return <SeedPhraseTable phrases={phrases} />;
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

export default function DashboardPage() {
   // Authentication Check - REMOVED
   // let userEmail: string | null = null;
   // const { session } = await getUserAuth();
   // if (!session?.user) { ... redirect logic ... }
   // userEmail = session.user.email;
   console.log("[Dashboard Page] Rendering dashboard (authentication disabled).");

   // Simulate a user identifier if needed locally, otherwise backend needs to handle identification
   const simulatedUserIdentifier = "user@example.com (Simulated)"; // Placeholder

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SeedVault Dashboard</h1>
           {/* Display simulated user info */}
           <p className="text-muted-foreground mt-1 flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                {/* Display placeholder or fetch user info differently if backend supports it without auth */}
                Viewing entries (authentication disabled).
           </p>
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
              <span className="block mt-1 text-xs text-muted-foreground">(Actions may be limited without authentication).</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<TableSkeleton />}>
               <SeedPhraseList />
           </Suspense>
        </CardContent>
      </Card>

        <div className="mt-8 flex flex-col items-center gap-4">
           {/* Delete account button - needs update to work without auth */}
           <Suspense fallback={<Button variant="destructive" disabled>Loading...</Button>}>
               <DeleteAccountButton />
           </Suspense>
           {/* Security Warning moved here */}
           <p className="text-destructive font-semibold text-center text-sm mt-4 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> SECURITY WARNING: Keep your seed phrases and associated information private. Avoid screenshots or sharing. SeedVault cannot recover lost data.
            </p>
       </div>
    </div>
  );
}
