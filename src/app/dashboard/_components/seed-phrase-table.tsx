
'use client';

import { useState, useEffect } from 'react';
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
import { Eye, Loader2, Copy, Check, AlertTriangle, LockKeyhole, EyeOff, Trash2 } from "lucide-react";
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from "@/lib/definitions";
import { useToast } from '@/hooks/use-toast';
import { revealSeedPhraseAction } from '../_actions/dashboard-actions';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

interface SeedPhraseTableProps {
  phrases: SeedPhraseMetadata[];
}

const LOCAL_STORAGE_REMOVED_KEY = 'seedvault_removed_phrases';

export default function SeedPhraseTable({ phrases: initialPhrases }: SeedPhraseTableProps) {
  const { toast } = useToast();
  const [phrases, setPhrases] = useState<SeedPhraseMetadata[]>([]);
  const [removedPhraseIds, setRemovedPhraseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedData, setRevealedData] = useState<RevealedSeedPhraseData | null>(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [phraseToDelete, setPhraseToDelete] = useState<SeedPhraseMetadata | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Load removed IDs from localStorage and filter initial phrases on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
    try {
      const storedRemovedIds = localStorage.getItem(LOCAL_STORAGE_REMOVED_KEY);
      const initialRemovedIds = storedRemovedIds ? new Set<string>(JSON.parse(storedRemovedIds)) : new Set<string>();
      setRemovedPhraseIds(initialRemovedIds);
      // Filter the initial phrases based on the loaded removed IDs
      setPhrases(initialPhrases.filter(p => !initialRemovedIds.has(p._id)));
    } catch (error) {
        console.error("Error reading removed phrases from localStorage:", error);
        // If localStorage fails, just show all initial phrases
        setPhrases(initialPhrases);
    }
  }, [initialPhrases]); // Rerun if initialPhrases changes

  // --- Decryption Placeholder ---
  const decryptData = (encryptedData: string | undefined | null): string => {
    if (!encryptedData) {
        return "[Not Provided]";
    }
    if (encryptedData.startsWith('ENCRYPTED(') && encryptedData.endsWith(')')) {
        return encryptedData.substring(10, encryptedData.length - 1);
    }
    console.warn("Decryption attempt failed for data:", encryptedData);
    return "[Decryption Error]";
  };
  // --- End Decryption Placeholder ---

  const handleReveal = async (phraseId: string) => {
    setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: true }));
    setIsRevealing(true);
    setRevealedData(null);
    setIsRevealModalOpen(true);

    try {
      const result = await revealSeedPhraseAction(phraseId);
      if (result.data) {
        setRevealedData(result.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Reveal Failed',
          description: result.error || 'Could not retrieve seed phrase details.',
        });
        setIsRevealModalOpen(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while revealing the phrase.',
      });
      console.error("Reveal error:", error);
      setIsRevealModalOpen(false);
    } finally {
      setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: false }));
      setIsRevealing(false);
    }
  };

  // Client-side "delete" - removes from view and persists the removal in localStorage
  const handleLocalDeleteConfirm = (phraseId: string) => {
     // Update state first for immediate UI feedback
    setPhrases(prevPhrases => prevPhrases.filter(p => p._id !== phraseId));
    const newRemovedIds = new Set(removedPhraseIds).add(phraseId);
    setRemovedPhraseIds(newRemovedIds);

    // Update localStorage (only on client)
    if (isClient) {
        try {
            localStorage.setItem(LOCAL_STORAGE_REMOVED_KEY, JSON.stringify(Array.from(newRemovedIds)));
             toast({
               title: 'Seed phrase deleted successfully', // Updated title
               description: 'The entry has been removed from your view. It has not been deleted from the database.', // Updated description
             });
        } catch (error) {
            console.error("Error writing removed phrases to localStorage:", error);
             toast({
                variant: 'destructive',
                title: 'Error Removing Phrase',
                description: 'Could not save the removed state locally. The phrase might reappear on refresh.',
             });
             // Optionally revert state if saving fails critically? Depends on desired UX.
             // setPhrases(initialPhrases.filter(p => !removedPhraseIds.has(p._id))); // Revert to previous state
        }
    }

    setPhraseToDelete(null); // Close confirmation dialog
  };

  const handleCopyToClipboard = (text: string | undefined | null, fieldName: string) => {
     const textToCopy = text || "";
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
          {phrases.length === 0 && isClient && ( // Only show "No phrases" after client-side check
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                    No seed phrases found or all have been hidden.
                </TableCell>
            </TableRow>
          )}
          {!isClient && ( // Show skeleton rows while loading/hydrating
             [...Array(3)].map((_, i) => (
               <TableRow key={`skel-${i}`}>
                 <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                 <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                 <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                 <TableCell className="text-right space-x-2">
                   <Skeleton className="h-8 w-8 inline-block" />
                   <Skeleton className="h-8 w-8 inline-block" />
                 </TableCell>
               </TableRow>
             ))
          )}
          {isClient && phrases.map((phrase) => (
            <TableRow key={phrase._id}>
              <TableCell className="font-medium">{phrase.walletName}</TableCell>
              <TableCell>
                 <Badge variant="secondary" className="whitespace-nowrap">{phrase.walletType}</Badge>
              </TableCell>
              <TableCell>
                 {isClient ? format(new Date(phrase.createdAt), "PPp") : <Skeleton className="h-4 w-32" />}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {/* Reveal Button */}
                <Button
                   variant="outline"
                   size="icon"
                   onClick={() => handleReveal(phrase._id)}
                   disabled={isLoading[`reveal-${phrase._id}`] || isRevealing}
                   aria-label={`Reveal details for ${phrase.walletName}`}
                   title={`Reveal details for ${phrase.walletName}`}
                 >
                  {isLoading[`reveal-${phrase._id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                 </Button>

                {/* "Delete" Button (Client-side removal only) */}
                 <AlertDialog>
                     <AlertDialogTrigger asChild>
                         <Button
                             variant="destructive"
                             size="icon"
                             aria-label={`Remove ${phrase.walletName} from view`}
                             title={`Remove ${phrase.walletName} from view`}
                             onClick={() => setPhraseToDelete(phrase)}
                         >
                             <Trash2 className="h-4 w-4" />
                         </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                         <AlertDialogHeader>
                             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                             <AlertDialogDescription>
                                This will delete your seed phrase and cannot be recovered, are you sure?
                             </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                             <AlertDialogCancel onClick={() => setPhraseToDelete(null)}>Cancel</AlertDialogCancel>
                             <AlertDialogAction
                                 onClick={() => phraseToDelete && handleLocalDeleteConfirm(phraseToDelete._id)}
                                 className="bg-destructive hover:bg-destructive/90"
                              >
                                 Delete
                             </AlertDialogAction>
                         </AlertDialogFooter>
                     </AlertDialogContent>
                 </AlertDialog>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

       {/* Reveal Modal using Dialog */}
      <Dialog open={isRevealModalOpen} onOpenChange={setIsRevealModalOpen}>
         <DialogContent className="sm:max-w-[550px] w-[95vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                 <LockKeyhole className="mr-2 h-5 w-5 text-primary"/> Revealed Details
              </DialogTitle>
               {!isRevealing && revealedData && (
                 <DialogDescription>
                   Details for: <span className="font-semibold">{revealedData.walletName}</span> (<Badge variant="outline" className="text-xs">{revealedData.walletType}</Badge>).
                   {/* Removed security warning from here */}
                 </DialogDescription>
               )}
               {isRevealing && (
                  <DialogDescription>Loading details...</DialogDescription>
               )}
            </DialogHeader>
             {isRevealing ? (
                 <div className="space-y-4 py-4">
                     <Skeleton className="h-8 w-full" />
                     <Skeleton className="h-8 w-full" />
                     <Skeleton className="h-20 w-full" />
                 </div>
             ) : revealedData ? (
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-[100px_1fr_auto] items-center gap-3">
                         <Label htmlFor="revealed-email" className="text-right font-medium text-sm pr-2">
                             Assoc. Email
                         </Label>
                         <Input
                             id="revealed-email"
                             value={decryptData(revealedData.encryptedEmail)}
                             readOnly
                             className="col-span-1 font-mono text-xs sm:text-sm h-9"
                             aria-label="Revealed Associated Email"
                         />
                         <Button
                             variant="ghost"
                             size="icon"
                             className="h-9 w-9"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedEmail), 'Email')}
                             aria-label="Copy Associated Email"
                             title="Copy Associated Email"
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
                             value={decryptData(revealedData.encryptedEmailPassword)}
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
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                             variant="ghost"
                             size="icon"
                             className="h-9 w-9"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedEmailPassword), 'Password')}
                             aria-label="Copy Associated Password"
                             title="Copy Associated Password"
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
                            value={decryptData(revealedData.encryptedSeedPhrase)}
                            readOnly
                            rows={4}
                            className="col-span-1 font-mono text-xs sm:text-sm p-2 border rounded-md bg-muted/50 resize-none h-auto"
                            aria-label="Revealed Seed Phrase"
                         />
                          <Button
                             variant="ghost"
                             size="icon"
                             className="mt-1 h-9 w-9"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedSeedPhrase), 'Seed Phrase')}
                             aria-label="Copy Seed Phrase"
                             title="Copy Seed Phrase"
                          >
                            {copyStatus['Seed Phrase'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                     <p className="text-xs text-muted-foreground text-center pt-2">
                         Data is shown after applying placeholder decryption. Implement robust client-side decryption using a secure key derivation method.
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
