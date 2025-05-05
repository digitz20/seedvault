
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, AlertTriangle, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { getSeedPhraseMetadataAction } from "./_actions/dashboard-actions";
import SeedPhraseTable from "./_components/seed-phrase-table";
import DeleteAccountButton from './_components/delete-account-button';
import type { SeedPhraseMetadata } from '@/lib/definitions';

// Component to fetch and display data, handling loading and errors
async function SeedPhraseList() {
  const { phrases, error } = await getSeedPhraseMetadataAction();

  if (error) {
    return (
      <div className="text-center py-12 text-destructive flex flex-col items-center gap-2">
         <AlertTriangle className="w-10 h-10" />
         <p className="font-semibold">Error loading seed phrases</p>
         <p className="text-sm max-w-md">{error}</p>
         <p className="text-xs text-muted-foreground mt-2">Please ensure the backend server is running and accessible.</p>
      </div>
    );
  }

  // Note: The filtering of 'removed' phrases happens client-side in SeedPhraseTable
  // This component just passes all fetched phrases down.
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
             <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
             <div className="space-y-2">
                 {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-10 bg-muted/50 rounded w-full animate-pulse"></div>
                 ))}
             </div>
        </div>
    )
}

export default function DashboardPage() {

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SeedVault Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View all securely stored seed phrase entries.
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
          <CardTitle>Saved Seed Phrases</CardTitle>
          <CardDescription>
             All stored wallet information. Click the eye icon <Eye className="inline h-4 w-4 text-muted-foreground align-text-bottom" /> to reveal details,
             or the trash icon <Trash2 className="inline h-4 w-4 text-muted-foreground align-text-bottom" /> to remove an entry from this view. Removed entries are hidden locally and will not be deleted from the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Suspense fallback={<TableSkeleton />}>
               <SeedPhraseList />
           </Suspense>
        </CardContent>
      </Card>

        <div className="mt-8 flex flex-col items-center gap-4">
           <DeleteAccountButton />
            {/* Security Warning moved here */}
           <p className="text-destructive font-semibold text-center text-sm mt-4 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> SECURITY WARNING: Keep your seed phrases and associated information private. Avoid screenshots or sharing. SeedVault cannot recover lost data.
            </p>
       </div>
    </div>
  );
}
