
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserAuth } from "@/lib/auth/utils";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSeedPhraseMetadataAction } from "./_actions/dashboard-actions";
import SeedPhraseTable from "./_components/seed-phrase-table";

export default async function DashboardPage() {
  // 1. Check Authentication
  const { session } = await getUserAuth();
  if (!session) {
    // This should ideally be caught by middleware, but double-check
    redirect("/login?message=Please log in to view your dashboard.");
  }

  // 2. Fetch Seed Phrase Metadata
  const { phrases, error } = await getSeedPhraseMetadataAction();

  if (error) {
    // Handle error fetching data (e.g., show a message)
    // This could be a toast notification or an error message component
    console.error("Error fetching dashboard data:", error);
    // For now, just show a message on the page
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your SeedVault Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your securely stored seed phrases. Welcome, {session.user?.email}!
          </p>
           {error && <p className="text-destructive mt-2 text-sm">Error loading phrases: {error}</p>}
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
            Your stored wallet information. Click 'Reveal' to view details (requires confirmation) or 'Delete' to remove an entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {phrases && phrases.length > 0 ? (
            <SeedPhraseTable phrases={phrases} />
          ) : (
             !error && ( // Only show "no phrases" if there wasn't an error loading them
                <div className="text-center py-12">
                    <p className="text-muted-foreground">You haven't saved any seed phrases yet.</p>
                    <Button asChild variant="link" className="mt-2">
                       <Link href="/save-seed">Add your first one!</Link>
                    </Button>
                </div>
             )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
