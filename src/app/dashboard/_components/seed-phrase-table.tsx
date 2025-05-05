
'use client';

import { useState } from 'react';
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
import { Eye, Trash2, Loader2, Copy, Check, AlertTriangle, LockKeyhole } from "lucide-react";
import type { SeedPhraseMetadata, RevealedSeedPhraseData } from "@/lib/definitions";
import { useToast } from '@/hooks/use-toast';
import { deleteSeedPhraseAction, revealSeedPhraseAction } from '../_actions/dashboard-actions';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input'; // For displaying revealed data
import { Label } from '@/components/ui/label'; // For labeling revealed data
import { Badge } from '@/components/ui/badge'; // To show wallet type nicely

interface SeedPhraseTableProps {
  phrases: SeedPhraseMetadata[];
}

export default function SeedPhraseTable({ phrases: initialPhrases }: SeedPhraseTableProps) {
  const { toast } = useToast();
  const [phrases, setPhrases] = useState<SeedPhraseMetadata[]>(initialPhrases);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // Track loading state per row (reveal/delete)
  const [revealedData, setRevealedData] = useState<RevealedSeedPhraseData | null>(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({}); // Track copy status per field

  // --- Decryption Placeholder ---
  // Replace this with your actual client-side decryption logic
  const decryptData = (encryptedData: string): string => {
    // *** WARNING: THIS IS A PLACEHOLDER - IMPLEMENT REAL DECRYPTION ***
    // Example: Use crypto-js, SubtleCrypto API, etc., with the user's derived key
    if (encryptedData.startsWith('ENCRYPTED(') && encryptedData.endsWith(')')) {
        return encryptedData.substring(10, encryptedData.length - 1);
    }
    return "[Decryption Failed]"; // Indicate failure
    // *** END PLACEHOLDER ***
  };
  // --- End Decryption Placeholder ---

  const handleReveal = async (phraseId: string) => {
    setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: true }));
    setRevealedData(null); // Clear previous data

    try {
      const result = await revealSeedPhraseAction(phraseId);
      if (result.data) {
        setRevealedData(result.data);
        setIsRevealModalOpen(true); // Open the modal only on success
      } else {
        toast({
          variant: 'destructive',
          title: 'Reveal Failed',
          description: result.error || 'Could not retrieve seed phrase details.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while revealing the phrase.',
      });
      console.error("Reveal error:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, [`reveal-${phraseId}`]: false }));
    }
  };

  const handleDelete = async (phraseId: string) => {
    setIsLoading(prev => ({ ...prev, [`delete-${phraseId}`]: true }));
    try {
      const result = await deleteSeedPhraseAction(phraseId);
      if (result.success) {
        // Remove the phrase from the local state to update the UI instantly
        setPhrases(currentPhrases => currentPhrases.filter(p => p._id !== phraseId));
        toast({
          title: 'Success',
          description: 'Seed phrase entry deleted successfully.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: result.error || 'Could not delete the seed phrase entry.',
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
      setIsLoading(prev => ({ ...prev, [`delete-${phraseId}`]: false }));
    }
  };

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopyStatus(prev => ({ ...prev, [fieldName]: true }));
        setTimeout(() => setCopyStatus(prev => ({ ...prev, [fieldName]: false })), 1500); // Reset icon after 1.5s
        toast({ title: `${fieldName} copied to clipboard!`});
    }).catch(err => {
        console.error('Failed to copy:', err);
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy text.' });
    });
  };

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
          {phrases.map((phrase) => (
            <TableRow key={phrase._id}>
              <TableCell className="font-medium">{phrase.walletName}</TableCell>
              <TableCell>
                 <Badge variant="secondary">{phrase.walletType}</Badge>
              </TableCell>
              <TableCell>{format(new Date(phrase.createdAt), "PPp")}</TableCell> {/* Format date nicely */}
              <TableCell className="text-right space-x-2">
                {/* Reveal Button */}
                <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleReveal(phrase._id)}
                   disabled={isLoading[`reveal-${phrase._id}`]}
                   aria-label={`Reveal details for ${phrase.walletName}`}
                 >
                  {isLoading[`reveal-${phrase._id}`] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                 </Button>

                {/* Delete Button with Confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button
                         variant="destructive"
                         size="sm"
                         disabled={isLoading[`delete-${phrase._id}`]}
                         aria-label={`Delete entry for ${phrase.walletName}`}
                     >
                       {isLoading[`delete-${phrase._id}`] ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <Trash2 className="h-4 w-4" />
                       )}
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        seed phrase entry for <span className="font-semibold">{phrase.walletName}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(phrase._id)}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isLoading[`delete-${phrase._id}`]}
                      >
                         {isLoading[`delete-${phrase._id}`] ? 'Deleting...' : 'Yes, delete it'}
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
         <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                 <LockKeyhole className="mr-2 h-5 w-5 text-primary"/> Reveal Seed Phrase Details
              </DialogTitle>
              <DialogDescription>
                Showing details for: <span className="font-semibold">{revealedData?.walletName}</span> ({revealedData?.walletType}).
                <br />
                 <span className="text-destructive font-semibold mt-2 block flex items-center">
                      <AlertTriangle className="mr-1 h-4 w-4" /> SECURITY WARNING: Keep this information private. Avoid screenshots.
                 </span>
              </DialogDescription>
            </DialogHeader>
             {revealedData && (
                 <div className="grid gap-4 py-4">
                     {/* Wallet/Service Email */}
                     <div className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                         <Label htmlFor="revealed-email" className="text-right font-medium">
                             Wallet Email
                         </Label>
                         <Input
                             id="revealed-email"
                             value={decryptData(revealedData.encryptedEmail)}
                             readOnly
                             className="col-span-1 font-mono text-sm"
                             aria-label="Revealed Wallet/Service Email"
                         />
                         <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedEmail), 'Email')}
                             aria-label="Copy Wallet Email"
                            >
                             {copyStatus['Email'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                      {/* Wallet/Service Password */}
                     <div className="grid grid-cols-[120px_1fr_auto] items-center gap-3">
                         <Label htmlFor="revealed-password" className="text-right font-medium">
                             Wallet Password
                         </Label>
                         <Input
                             id="revealed-password"
                             type="password" // Initially hide, consider a toggle later
                             value={decryptData(revealedData.encryptedEmailPassword)}
                             readOnly
                             className="col-span-1 font-mono text-sm"
                              aria-label="Revealed Wallet/Service Password"
                         />
                          <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedEmailPassword), 'Password')}
                             aria-label="Copy Wallet Password"
                          >
                             {copyStatus['Password'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                      {/* Seed Phrase */}
                     <div className="grid grid-cols-[120px_1fr_auto] items-start gap-3">
                         <Label htmlFor="revealed-seed" className="text-right font-medium mt-2">
                             Seed Phrase
                         </Label>
                         <textarea
                            id="revealed-seed"
                            value={decryptData(revealedData.encryptedSeedPhrase)}
                            readOnly
                            rows={4}
                            className="col-span-1 font-mono text-sm p-2 border rounded-md bg-muted/50 resize-none"
                            aria-label="Revealed Seed Phrase"
                         />
                          <Button
                             variant="ghost"
                             size="icon"
                             className="mt-1"
                             onClick={() => handleCopyToClipboard(decryptData(revealedData.encryptedSeedPhrase), 'Seed Phrase')}
                             aria-label="Copy Seed Phrase"
                          >
                            {copyStatus['Seed Phrase'] ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                         </Button>
                     </div>
                 </div>
             )}
             {/* Modal Footer */}
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
