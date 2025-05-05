'use client';

import type { SeedPhraseData } from '@/lib/definitions';
import { useState } from 'react';
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
import { deleteSeedPhraseAction } from '../_actions/delete-seed-action'; // Import delete action


// --- Placeholder Decryption ---
// Replace with your actual decryption logic corresponding to the encryption method used
function decrypt(encryptedText: string): string {
   // --- !!! ---
   // THIS IS A PLACEHOLDER - DO NOT USE IN PRODUCTION
   // Implement actual decryption matching your encryption method in save-seed-action.ts
   // --- !!! ---
    try {
       return Buffer.from(encryptedText, 'base64').toString('utf8');
        // --- Real Decryption Example (Conceptual) ---
        // const parts = encryptedText.split(':');
        // if (parts.length !== 3) throw new Error('Invalid encrypted format');
        // const [ivHex, authTagHex, encryptedData] = parts;
        // const iv = Buffer.from(ivHex, 'hex');
        // const authTag = Buffer.from(authTagHex, 'hex');
        // const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
        // decipher.setAuthTag(authTag);
        // let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        // decrypted += decipher.final('utf8');
        // return decrypted;
        // --- End Real Decryption Example ---
    } catch (e) {
       console.error("Decryption failed:", e);
       // Handle decryption failure gracefully - show error or masked text
       return "[Decryption Error]";
    }
}
// --- End Placeholder Decryption ---

interface SeedPhraseListProps {
  seedPhrases: SeedPhraseData[];
}

export function SeedPhraseList({ seedPhrases }: SeedPhraseListProps) {
  const [visiblePhrases, setVisiblePhrases] = useState<Record<string, boolean>>({});
   const [decryptedPhrases, setDecryptedPhrases] = useState<Record<string, string>>({});
   const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // Loading state per item
   const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({}); // Deleting state per item
  const { toast } = useToast();


  const toggleVisibility = (id: string | undefined) => {
     if (!id) return;
    setVisiblePhrases(prev => {
       const isVisible = !prev[id];
       // If revealing, attempt decryption
        if (isVisible && !decryptedPhrases[id]) {
           const phraseData = seedPhrases.find(p => p._id?.toString() === id);
           if (phraseData?.seedPhrase) {
             setDecryptedPhrases(currentDecrypted => ({
               ...currentDecrypted,
               [id]: decrypt(phraseData.seedPhrase)
             }));
           }
        }
        return { ...prev, [id]: isVisible };
    });
  };

  const handleDelete = async (id: string | undefined) => {
     if (!id) return;
      setIsDeleting(prev => ({ ...prev, [id]: true }));
     try {
       const result = await deleteSeedPhraseAction(id);
       if (result.success) {
         toast({
           title: 'Success',
           description: 'Seed phrase deleted successfully.',
         });
         // Note: Revalidation should happen on the server,
         // but you might want to optimistically remove from the client state too
         // or simply rely on the next page load/refresh.
       } else {
         toast({
           variant: 'destructive',
           title: 'Error',
           description: result.error || 'Failed to delete seed phrase.',
         });
       }
     } catch (error) {
       toast({
         variant: 'destructive',
         title: 'Error',
         description: 'An unexpected error occurred while deleting.',
       });
       console.error("Delete error:", error);
     } finally {
         setIsDeleting(prev => ({ ...prev, [id]: false }));
     }
   };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {seedPhrases.map((phrase) => {
         const idString = phrase._id?.toString(); // Get string ID for state keys
         if (!idString) return null; // Should not happen if data is fetched correctly

        const isVisible = !!visiblePhrases[idString];
        const decryptedText = decryptedPhrases[idString] || '';
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
                      <span>{decryptedText || 'Could not decrypt'}</span>
                   ) : (
                      <span className="italic text-muted-foreground">Click eye icon to reveal</span>
                   )}
                </div>
               <p className="text-xs text-muted-foreground">
                 Saved: {phrase.createdAt ? new Date(phrase.createdAt).toLocaleDateString() : 'N/A'}
               </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-4 mt-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleVisibility(idString)}
                aria-label={isVisible ? 'Hide seed phrase' : 'Show seed phrase'}
                disabled={isLoadingItem || isDeletingItem}
              >
                 {isLoadingItem ? <Loader2 className="animate-spin" /> : isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>

               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button
                     variant="destructive"
                     size="icon"
                     aria-label="Delete seed phrase"
                      disabled={isDeletingItem || isLoadingItem}
                   >
                     {isDeletingItem ? <Loader2 className="animate-spin" /> : <Trash2 className="h-5 w-5" />}
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
                        {isDeletingItem ? <Loader2 className="animate-spin mr-2" /> : null}
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
