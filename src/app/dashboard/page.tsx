
import { Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getSeedPhraseMetadataAction } from "./_actions/dashboard-actions";
import SeedPhraseTable from "./_components/seed-phrase-table";
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

  if (!phrases || phrases.length === 0) {
    return (
       <div className="text-center py-12">
         <p className="text-muted-foreground">No seed phrases have been saved yet.</p>
         <Button asChild variant="link" className="mt-2">
           <Link href="/save-seed">Add the first one!</Link>
         </Button>
       </div>
    );
  }

  return <SeedPhraseTable phrases={phrases} />;
}

// Skeleton loader for the table
function TableSkeleton() {
    return (
        <div className="space-y-4 p-4">
             <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div> {/* Header pulse */}
             <div className="space-y-2">
                 {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-10 bg-muted/50 rounded w-full animate-pulse"></div>
                 ))}
             </div>
        </div>
    )
}

export default function DashboardPage() {
  // Page is public, no authentication needed

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
            All stored wallet information. Click the eye icon <EyeIcon className="inline h-4 w-4 text-muted-foreground" /> to reveal details or the trash icon <Trash2Icon className="inline h-4 w-4 text-muted-foreground" /> to delete an entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* Use Suspense to handle loading state while data is fetched */}
           <Suspense fallback={<TableSkeleton />}>
               <SeedPhraseList />
           </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline SVG or simple icons for description text where lucide might be overkill or cause hydration issues if not static
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const Trash2Icon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        <line x1="10" x2="10" y1="11" y2="17"/>
        <line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
);
