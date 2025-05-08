
'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Added React import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Loader2, Copy, Check, AlertTriangle, LockKeyhole, EyeOff, Trash2, Unlock } from "lucide-react"; // Changed LockKeyhole to Unlock
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from "@/lib/definitions";
import { useToast } from '@/hooks/use-toast';
// Import reveal action, REMOVE delete action import
// Simulating no auth, so actions are disabled/not called
// import { revealSeedPhraseAction } from '../_actions/dashboard-actions';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

interface SeedPhraseTableProps {
  phrases: SeedPhraseMetadata[];
}

// Memoize the table row component to avoid unnecessary re-renders
const MemoizedTableRow = React.memo(({ phrase, isLoading, handleReveal, setPhraseToDelete }: {
    phrase: SeedPhraseMetadata;
    isLoading: Record<string, boolean>;
    handleReveal: (id: string) => void;
    setPhraseToDelete: (phrase: SeedPhraseMetadata | null) => void;
 }) => {
     // Use state to manage client-side rendering for date
     const [formattedDate, setFormattedDate] = useState<string | null>(null);
     const [isClient, setIsClient] = useState(false);

     useEffect(() => {
         setIsClient(true);
         // Format date only on client after mount
         // console.time(`[MemoizedTableRow Date Formatting] ID: ${phrase._id}`); // Reduced logging noise
         try {
             setFormattedDate(format(new Date(phrase.createdAt), "PPp"));
         } catch (e) {
              console.error("Error formatting date:", e, phrase.createdAt);
              setFormattedDate("Invalid Date"); // Set placeholder on error
         }
          // console.timeEnd(`[MemoizedTableRow Date Formatting] ID: ${phrase._id}`);
     }, [phrase.createdAt, phrase._id]); // **Add phrase._id to dependencies**

    return (
        <TableRow key={phrase._id}>
            <TableCell className="font-medium">{phrase.walletName}</TableCell>
            <TableCell>
                <Badge variant="secondary" className="whitespace-nowrap">{phrase.walletType}</Badge>
            </TableCell>
            <TableCell>
                {isClient ? (formattedDate || <Skeleton className="h-4 w-32" />) : <Skeleton className="h-4 w-32" />}
            </TableCell>
            <TableCell className="text-right space-x-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => handleReveal(phrase._id)}
                disabled={isLoading[`reveal-${phrase._id}`] || isLoading[`delete-${phrase._id}`]}
                aria-label={`Reveal details for ${phrase.walletName}`}
                title={`Reveal details for ${phrase.walletName}`}
                >
                {isLoading[`reveal-${phrase._id}`] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                <Eye className="h-4 w-4" />
                )}
            </Button>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="icon"
                    aria-label={`Delete ${phrase.walletName}`}
                    title={`Delete ${phrase.walletName}`}
                    onClick={() => setPhraseToDelete(phrase)}
                    disabled={isLoading[`delete-${phrase._id}`] || isLoading[`reveal-${phrase._id}`]}
                >
                {isLoading[`delete-${phrase._id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Trash2 className="h-4 w-4" />
                )}
                </Button>
            </AlertDialogTrigger>
            </TableCell>
        </TableRow>
    );
});
MemoizedTableRow.displayName = 'MemoizedTableRow'; // Set display name for DevTools


export function SeedPhraseTable({ phrases: initialPhrases }: SeedPhraseTableProps) {
  const { toast } = useToast();
  const [phrases, setPhrases] = useState<SeedPhraseMetadata[]>(initialPhrases);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // Combined loading state
  const [revealedData, setRevealedData] = useState<RevealedSeedPhraseData | null>(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [phraseToDelete, setPhraseToDelete] = useState<SeedPhraseMetadata | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPhrases(initialPhrases);
  }, [initialPhrases]);

  // --- Function to get plain text data ---
  const getPlainTextData = (data: string | undefined | null): string => {
    if (data === undefined || data === null || data === '') {
      return "[Not Provided]";
    }
    return data;
  };
  // --- End Plain Text Handling ---

  const handleReveal = async (phraseId: string) => {
    setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: true }));
    setRevealedData(null);
    setIsRevealModalOpen(true);

    // Simulate API call delay (remove in production)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find the phrase locally (as backend call is bypassed)
    const phraseMeta = phrases.find(p => p._id === phraseId);
    if (phraseMeta) {
        // Simulate revealed data (replace with actual API call result if needed)
        const simulatedRevealed: RevealedSeedPhraseData = {
            _id: phraseMeta._id,
            walletName: phraseMeta.walletName,
            walletType: phraseMeta.walletType,
            email: `associated-${phraseId.substring(0,5)}@email.com`, // Placeholder
            emailPassword: `password-${phraseId.substring(0,5)}`, // Placeholder
            seedPhrase: `simulated seed phrase for wallet ${phraseId.substring(0,5)} twelve words example demo only test` // Placeholder
        };
        setRevealedData(simulatedRevealed);
    } else {
        toast({
            variant: 'destructive',
            title: 'Reveal Failed',
            description: 'Could not find phrase details locally.',
        });
        setIsRevealModalOpen(false);
    }

    setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: false }));
  };

  // Function to handle removing the entry from the local UI state only
  const handleLocalDeleteConfirm = (phraseId: string) => {
     setIsLoading(prev => ({ ...prev, [`delete-${phraseId}`]: true }));
     const phraseBeingDeleted = phraseToDelete;
     setPhraseToDelete(null); // Close dialog

     // Simulate a short delay for visual feedback (optional)
     setTimeout(() => {
       try {
          // Update the UI state directly without calling the backend
          if (phraseBeingDeleted) {
              setPhrases(currentPhrases => currentPhrases.filter(p => p._id !== phraseBeingDeleted._id));
              toast({
                 title: 'Entry Removed',
                 description: 'The seed phrase entry has been removed from view.', // Updated message
               });
          } else {
               toast({
                 variant: 'destructive',
                 title: 'Error Removing Entry',
                 description: 'Could not find the entry to remove locally.',
               });
          }
       } catch (error) {
          toast({
             variant: 'destructive',
             title: 'Error',
             description: 'An unexpected error occurred while removing the entry locally.',
          });
         console.error("Local delete error:", error);
       } finally {
         setIsLoading(prev => ({ ...prev, [`delete-${phraseId}`]: false }));
       }
     }, 300); // Short delay e.g., 300ms
  };

  const handleCopyToClipboard = (text: string | undefined | null, fieldName: string) => {
     const textToCopy = text || "";
     if (!isClient) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyStatus(prev => ({ ...prev, [fieldName]: true }));
        setTimeout(() => setCopyStatus(prev => ({ ...prev, [fieldName]: false })), 1500);
        toast({ title: `${fieldName} copied to clipboard!`});
    }).catch(err => {
        console.error('Failed to copy:', err);
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy text to clipboard.' });
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Wallet Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phrases.length === 0 && isClient && (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No seed phrases found.
                </TableCell>
            </TableRow>
          )}
           {!isClient && initialPhrases.length === 0 && (
               <TableRow>
                   <TableCell colSpan={4} className="h-24 text-center">
                       <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                   </TableCell>
               </TableRow>
           )}
          {!isClient && initialPhrases.length > 0 && (
             initialPhrases.map((phrase) => (
               <TableRow key={`skel-${phrase._id}`}>
                 <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                 <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                 <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                 <TableCell className="text-right space-x-2">
                   <Skeleton className="h-8 w-8 inline-block rounded-md" />
                   <Skeleton className="h-8 w-8 inline-block rounded-md" />
                 </TableCell>
               </TableRow>
             ))
          )}
           {/* Use MemoizedTableRow here */}
          {isClient && phrases.map((phrase) => (
              <AlertDialog key={`alert-${phrase._id}`} open={phraseToDelete?._id === phrase._id} onOpenChange={(open) => !open && setPhraseToDelete(null)}>
                  <MemoizedTableRow
                    phrase={phrase}
                    isLoading={isLoading}
                    handleReveal={handleReveal}
                    setPhraseToDelete={setPhraseToDelete}
                   />
                   {/* Keep AlertDialogContent associated but outside the memoized row itself */}
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the entry &quot;{phraseToDelete?.walletName}&quot; from your view.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setPhraseToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                              onClick={() => phraseToDelete && handleLocalDeleteConfirm(phraseToDelete._id)} // Use local handler
                              className="bg-destructive hover:bg-destructive/90"
                          >
                              Remove from View
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isRevealModalOpen} onOpenChange={setIsRevealModalOpen}>
         <DialogContent className="sm:max-w-[550px] w-[95vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                 <Unlock className="mr-2 h-5 w-5 text-primary"/> Revealed Details
              </DialogTitle>
               {isLoading[`reveal-${revealedData?._id}`] || (!revealedData && isRevealModalOpen) ? (
                  <DialogDescription>Loading details...</DialogDescription>
               ) : revealedData ? (
                  <DialogDescription>
                     <span>Details for: <span className="font-semibold">{revealedData.walletName}</span> (<Badge variant="outline" className="text-xs">{revealedData.walletType}</Badge>).</span>
                     <span className="block mt-1 text-xs text-destructive font-medium">Data is shown in plain text. Ensure you understand the security implications.</span>
                   </DialogDescription>
               ) : (
                   <DialogDescription>Could not load details.</DialogDescription>
               )}
            </DialogHeader>
             {isLoading[`reveal-${revealedData?._id}`] || (!revealedData && isRevealModalOpen) ? (
                 <div className="space-y-4 py-4">
                     <div className="flex items-center gap-3"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-9 w-full" /> <Skeleton className="h-9 w-9" /></div>
                     <div className="flex items-center gap-3"> <Skeleton className="h-5 w-24" /> <Skeleton className="h-9 w-full" /> <Skeleton className="h-9 w-9" /> <Skeleton className="h-9 w-9" /> </div>
                     <div className="flex items-start gap-3"> <Skeleton className="h-5 w-24 mt-1" /> <Skeleton className="h-20 w-full" /> <Skeleton className="h-9 w-9 mt-1" /></div>
                 </div>
             ) : revealedData ? (
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-[100px_1fr_auto] items-center gap-3">
                         <Label htmlFor="revealed-email" className="text-right font-medium text-sm pr-2">
                             Assoc. Email
                         </Label>
                         <Input
                             id="revealed-email"
                             value={getPlainTextData(revealedData.email)}
                             readOnly
                             className="col-span-1 font-mono text-xs sm:text-sm h-9"
                             aria-label="Revealed Associated Email"
                         />
                         <Button
                             variant="ghost"
                             size="icon"
                             className="h-9 w-9"
                             onClick={() => handleCopyToClipboard(getPlainTextData(revealedData.email), 'Email')}
                             aria-label="Copy Associated Email"
                             title="Copy Associated Email"
                             disabled={getPlainTextData(revealedData.email) === "[Not Provided]"}
                            >
                             {copyStatus['Email'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                     <div className="grid grid-cols-[100px_1fr_auto_auto] items-center gap-3">
                         <Label htmlFor="revealed-password" className="text-right font-medium text-sm pr-2">
                            Assoc. Pass
                         </Label>
                         <Input
                             id="revealed-password"
                             type={showPassword ? "text" : "password"}
                             value={getPlainTextData(revealedData.emailPassword)}
                             readOnly
                             className="col-span-1 font-mono text-xs sm:text-sm h-9"
                             aria-label="Revealed Associated Password"
                         />
                         <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              onClick={togglePasswordVisibility}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              title={showPassword ? "Hide password" : "Show password"}
                              disabled={getPlainTextData(revealedData.emailPassword) === "[Not Provided]"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                             variant="ghost"
                             size="icon"
                             className="h-9 w-9"
                             onClick={() => handleCopyToClipboard(getPlainTextData(revealedData.emailPassword), 'Password')}
                             aria-label="Copy Associated Password"
                             title="Copy Associated Password"
                             disabled={getPlainTextData(revealedData.emailPassword) === "[Not Provided]"}
                          >
                             {copyStatus['Password'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                     <div className="grid grid-cols-[100px_1fr_auto] items-start gap-3">
                         <Label htmlFor="revealed-seed" className="text-right font-medium text-sm mt-2 pr-2">
                             Seed Phrase
                         </Label>
                         <Textarea
                            id="revealed-seed"
                            value={getPlainTextData(revealedData.seedPhrase)}
                            readOnly
                            rows={4}
                            className="col-span-1 font-mono text-xs sm:text-sm p-2 border rounded-md bg-muted/50 resize-none h-auto"
                            aria-label="Revealed Seed Phrase"
                         />
                          <Button
                             variant="ghost"
                             size="icon"
                             className="mt-1 h-9 w-9"
                             onClick={() => handleCopyToClipboard(getPlainTextData(revealedData.seedPhrase), 'Seed Phrase')}
                             aria-label="Copy Seed Phrase"
                             title="Copy Seed Phrase"
                             disabled={getPlainTextData(revealedData.seedPhrase) === "[Not Provided]"}
                          >
                            {copyStatus['Seed Phrase'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                     <p className="text-xs text-destructive text-center pt-2 flex items-center justify-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> This data is stored and displayed in plain text. Ensure you understand the security implications.
                     </p>
                 </div>
             ) : (
                  <div className="text-center py-4 text-muted-foreground">
                      Could not load seed phrase details.
                  </div>
             )}
             <DialogFooter>
                 <DialogClose asChild>
                     <Button type="button" variant="secondary">
                         Close
                     </Button>
                 </DialogClose>
             </DialogFooter>
         </DialogContent>
     </Dialog>
    </>
  );
}

// Add default export
export default SeedPhraseTable;
