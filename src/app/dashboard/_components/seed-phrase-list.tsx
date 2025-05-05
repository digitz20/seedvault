
'use client';

import type { SeedPhraseMetadata, RevealedSeedPhrase } from '@/lib/definitions'; // Use Metadata and Revealed types
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
// Removed: import { deleteSeedPhraseAction } from '../_actions/delete-seed-action'; // No longer using server action directly
import { useRouter } from 'next/navigation'; // For potential refresh

// --- Client-Side API Calls ---
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// Function to get JWT token (replace with your actual token storage mechanism)
async function getAuthToken(): Promise<string | null> {
    // This is insecure if the token is in localStorage.
    // Ideally, the token is in an HttpOnly cookie and API calls are proxied
    // through the Next.js server to attach the cookie automatically.
    // Or, store token in memory (e.g., React Context) after login.
    // For this example, we assume a way to get it client-side (e.g., context).
    // Placeholder:
    // return localStorage.getItem('auth_token');
    // Since server actions can't access localStorage, and client components
    // should ideally not manage auth tokens directly for security,
    // we will assume the browser sends the HttpOnly cookie automatically.
    // If not using HttpOnly, this needs a proper implementation.
    return 'dummy-token-placeholder'; // Indicate token *should* be sent by browser
}


async function revealSeedPhraseApi(id: string): Promise<{ success: boolean; seedPhrase?: string; error?: string }> {
    const token = await getAuthToken(); // Get token if needed by API setup
    console.log(`[Reveal Seed API Call] Revealing ID: ${id}`);

    // We assume the HttpOnly cookie 'auth_token' is sent automatically by the browser
    // If not using HttpOnly cookies, you MUST include the token manually:
    // const headers: HeadersInit = { 'Content-Type': 'application/json' };
    // if (token && token !== 'dummy-token-placeholder') {
    //     headers['Authorization'] = `Bearer ${token}`;
    // }

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${id}/reveal`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }, // Browser handles cookie
            // headers: headers, // Use this line instead if manually sending token
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
             console.error(`[Reveal Seed API Call] Failed: ${errorData.message || response.statusText}`);
            return { success: false, error: errorData.message || `Failed to reveal seed phrase (${response.status})` };
        }

        const data: RevealedSeedPhrase = await response.json();
         console.log(`[Reveal Seed API Call] Success for ID: ${id}`);
        return { success: true, seedPhrase: data.seedPhrase };

    } catch (error) {
        console.error("[Reveal Seed API Call] Network error:", error);
        return { success: false, error: 'Network error trying to reveal seed phrase.' };
    }
}

async function deleteSeedPhraseApi(id: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();
     console.log(`[Delete Seed API Call] Deleting ID: ${id}`);

    // Assume HttpOnly cookie 'auth_token' is sent automatically
    // const headers: HeadersInit = { 'Content-Type': 'application/json' };
    // if (token && token !== 'dummy-token-placeholder') {
    //     headers['Authorization'] = `Bearer ${token}`;
    // }

    try {
        const response = await fetch(`${BACKEND_API_URL}/api/seed-phrases/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }, // Browser handles cookie
            // headers: headers, // Use this line instead if manually sending token
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
             console.error(`[Delete Seed API Call] Failed: ${errorData.message || response.statusText}`);
            return { success: false, error: errorData.message || `Failed to delete seed phrase (${response.status})` };
        }

        console.log(`[Delete Seed API Call] Success for ID: ${id}`);
        return { success: true };

    } catch (error) {
        console.error("[Delete Seed API Call] Network error:", error);
        return { success: false, error: 'Network error trying to delete seed phrase.' };
    }
}
// --- End Client-Side API Calls ---


// --- Decryption Placeholder ---
// If decryption happens client-side (requires secure key management), implement here.
// Otherwise, the backend handles decryption upon reveal request.
// function decrypt(encryptedText: string): string {
//    // Implement client-side decryption if necessary
//    return "[Client-Decrypted] " + encryptedText; // Placeholder
// }
// --- End Decryption Placeholder ---


interface SeedPhraseListProps {
  seedPhrases: SeedPhraseMetadata[]; // Now receives metadata
}

export function SeedPhraseList({ seedPhrases }: SeedPhraseListProps) {
  const [visiblePhrases, setVisiblePhrases] = useState<Record<string, boolean>>({});
  const [revealedPhrases, setRevealedPhrases] = useState<Record<string, string>>({}); // Store revealed plain text
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // Loading state per item (reveal)
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({}); // Deleting state per item
  const { toast } = useToast();
  const router = useRouter(); // To refresh data after delete

  const toggleVisibility = async (id: string | undefined) => {
     if (!id) return;

     const currentlyVisible = !!visiblePhrases[id];
     if (currentlyVisible) {
        // If hiding, just update state
        setVisiblePhrases(prev => ({ ...prev, [id]: false }));
     } else {
         // If revealing, check if already revealed or make API call
         if (revealedPhrases[id]) {
             setVisiblePhrases(prev => ({ ...prev, [id]: true }));
         } else {
            setIsLoading(prev => ({ ...prev, [id]: true }));
            const result = await revealSeedPhraseApi(id);
            setIsLoading(prev => ({ ...prev, [id]: false }));

            if (result.success && result.seedPhrase) {
                setRevealedPhrases(prev => ({ ...prev, [id]: result.seedPhrase! }));
                setVisiblePhrases(prev => ({ ...prev, [id]: true }));
            } else {
                 toast({
                     variant: 'destructive',
                     title: 'Error',
                     description: result.error || 'Could not reveal seed phrase.',
                 });
            }
         }
     }
  };

  const handleDelete = async (id: string | undefined) => {
     if (!id) return;
      setIsDeleting(prev => ({ ...prev, [id]: true }));
     try {
       // Call the API function
       const result = await deleteSeedPhraseApi(id);

       if (result.success) {
         toast({
           title: 'Success',
           description: 'Seed phrase deleted successfully.',
         });
         // Refresh the page data by triggering a router refresh
         // This will re-run the server component logic for the page
         router.refresh();
         // Note: optimistic UI update (removing item immediately) is also an option
       } else {
         toast({
           variant: 'destructive',
           title: 'Error',
           description: result.error || 'Failed to delete seed phrase.',
         });
       }
     } catch (error) {
       // Catch unexpected errors from the API call function itself
       toast({
         variant: 'destructive',
         title: 'Error',
         description: 'An unexpected error occurred while deleting.',
       });
       console.error("Delete error caught in component:", error);
     } finally {
         setIsDeleting(prev => ({ ...prev, [id]: false }));
     }
   };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {seedPhrases.map((phrase) => {
         const idString = phrase._id; // ID is already a string from backend
         if (!idString) return null; // Should not happen

        const isVisible = !!visiblePhrases[idString];
        const revealedText = revealedPhrases[idString] || ''; // Get revealed text
        const isLoadingItem = !!isLoading[idString];
        const isDeletingItem = !!isDeleting[idString];

        return (
          <Card key={idString} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{phrase.walletName}</CardTitle>
              <CardDescription>{phrase.walletType}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="relative rounded-md border bg-muted p-3 font-mono text-sm min-h-[80px]">
                   {isVisible ? (
                      // Display revealed text if visible
                      <span>{revealedText || '[Error retrieving phrase]'}</span>
                   ) : (
                       // Show placeholder when hidden
                      <span className="italic text-muted-foreground">Click eye icon to reveal</span>
                   )}
                   {isLoadingItem && !isVisible && ( // Show loader only when loading and not yet visible
                     <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                         <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                     </div>
                   )}
                </div>
               <p className="text-xs text-muted-foreground">
                 {/* Use optional chaining and nullish coalescing for safety */}
                 Saved: {phrase.createdAt ? new Date(phrase.createdAt).toLocaleDateString() : 'N/A'}
               </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVisibility(idString)}
                aria-label={isVisible ? 'Hide seed phrase' : 'Show seed phrase'}
                disabled={isLoadingItem || isDeletingItem} // Disable reveal button while deleting too
              >
                 {/* Show loader specifically during reveal loading, not general loading */}
                 {isLoadingItem ? <Loader2 className="animate-spin h-5 w-5" /> : isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>

               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button
                     variant="destructive"
                     size="icon"
                     aria-label="Delete seed phrase"
                      disabled={isDeletingItem || isLoadingItem} // Disable delete during reveal loading
                   >
                     {isDeletingItem ? <Loader2 className="animate-spin h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="text-destructive" /> Are you absolutely sure?
                     </AlertDialogTitle>
                     <AlertDialogDescription>
                       This action cannot be undone. This will permanently delete the seed phrase
                       for <span className="font-semibold">{phrase.walletName}</span>. Make sure you have a backup if needed.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel disabled={isDeletingItem}>Cancel</AlertDialogCancel>
                     <AlertDialogAction
                        onClick={() => handleDelete(idString)}
                        disabled={isDeletingItem}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeletingItem ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                       Yes, delete it
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>

            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
