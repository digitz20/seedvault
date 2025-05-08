
import React, { Suspense, lazy } from 'react'; // Import lazy
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, AlertTriangle, Eye, Trash2, LogOut } from "lucide-react"; // Removed Loader2
import Link from "next/link";
import { getSeedPhraseMetadataAction } from "./_actions/dashboard-actions"; // Import the metadata action
import type { SeedPhraseMetadata } from '@/lib/definitions';
// import { getUserAuth } from '@/lib/auth/utils'; // Removed as auth is simulated/bypassed
import { redirect } from 'next/navigation'; // Import redirect

// Lazy load SeedPhraseTable and DeleteAccountButton correctly
// Ensure SeedPhraseTable is the default export from its module
const SeedPhraseTable = lazy(() => import("./_components/seed-phrase-table"));
const DeleteAccountButton = lazy(() => import('./_components/delete-account-button'));


// Component to fetch and display data, handling loading and errors
async function SeedPhraseList() {
  // Authentication is currently bypassed. Fetching all phrases for demonstration.
  // In a real scenario, this action would need the user's ID/token.
  console.log("[Dashboard - SeedPhraseList] Fetching metadata (no auth)...");
  const { phrases, error } = await getSeedPhraseMetadataAction();

  if (error) {
    // Handle potential errors even without strict auth failure checks
    console.error("[Dashboard - SeedPhraseList] Error fetching metadata:", error);
    return (
      <div className="text-center py-12 text-destructive flex flex-col items-center gap-2">
         <AlertTriangle className="w-10 h-10" />
         <p className="font-semibold">Error loading seed phrases</p>
         <p className="text-sm max-w-md">{error}</p>
         <p className="text-xs text-muted-foreground mt-2">Please ensure the backend server is running and accessible.</p>
      </div>
    );
  }

  const allPhrases = phrases || [];
  console.log(`[Dashboard - SeedPhraseList] Fetched ${allPhrases.length} phrases.`);


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

  // Pass all phrases to the table
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
   // Authentication is bypassed for now
   const userEmail = "test@example.com"; // Placeholder email
   console.log(`[Dashboard Page] Rendering dashboard (auth bypassed). Placeholder user: ${userEmail}`);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SeedVault Dashboard</h1>
           {userEmail && (
              <p className="text-muted-foreground mt-1">
                Welcome, <span className="font-medium">{userEmail}</span>. View your saved seed phrases.
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
              or the trash icon <Trash2 className="inline h-4 w-4 text-muted-foreground align-text-bottom" /> to remove an entry from view.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<TableSkeleton />}>
               <SeedPhraseList />
           </Suspense>
        </CardContent>
      </Card>

        <div className="mt-8 flex flex-col items-center gap-4">
           {/* Delete account button - functionality needs review in no-auth context */}
           <Suspense fallback={<Button disabled>Loading...</Button>}>
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

